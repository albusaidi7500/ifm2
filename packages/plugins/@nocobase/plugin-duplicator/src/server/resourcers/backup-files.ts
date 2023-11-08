import { Dumper } from '../dumper';
import { DumpDataType } from '@nocobase/database';
import fs from 'fs';
import { koaMulter as multer } from '@nocobase/utils';
import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises';
import { Restorer } from '../restorer';
import _ from 'lodash';

export default {
  name: 'backupFiles',
  middleware: async (ctx, next) => {
    if (ctx.action.actionName !== 'upload') {
      return next();
    }

    const storage = multer.diskStorage({
      destination: os.tmpdir(),
      filename: function (req, file, cb) {
        const randomName = Date.now().toString() + Math.random().toString().slice(2); // 随机生成文件名
        cb(null, randomName);
      },
    });

    const upload = multer({ storage }).single('file');
    return upload(ctx, next);
  },
  actions: {
    async list(ctx, next) {},
    async get(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const dumper = new Dumper(ctx.app);
      const filePath = dumper.backUpFilePath(filterByTk);

      async function sendError(message, status = 404) {
        ctx.body = { status: 'error', message };
        ctx.status = status;
      }

      try {
        const fileState = await Dumper.getFileStatus(filePath);
        if (fileState.status !== 'ok') {
          await sendError(`Backup file ${filterByTk} not found`);
        } else {
          ctx.body = fileState;
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          await sendError(`Backup file ${filterByTk} not found`);
        }
      }

      await next();
    },

    /**
     * create dump task
     * @param ctx
     * @param next
     */
    async create(ctx, next) {
      const data = <
        {
          dataTypes: string[];
        }
      >ctx.request.body;

      const dumper = new Dumper(ctx.app);

      const taskId = await dumper.runDumpTask({
        dataTypes: new Set(data.dataTypes) as Set<DumpDataType>,
      });

      ctx.body = {
        key: taskId,
      };

      await next();
    },

    /**
     * download backup file
     * @param ctx
     * @param next
     */
    async download(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const dumper = new Dumper(ctx.app);

      const filePath = dumper.backUpFilePath(filterByTk);

      const fileState = await Dumper.getFileStatus(filePath);

      if (fileState.status !== 'ok') {
        throw new Error(`Backup file ${filterByTk} not found`);
      }

      ctx.attachment(filePath);
      ctx.body = fs.createReadStream(filePath);
      await next();
    },

    async restore(ctx, next) {
      const { filterByTk, dataTypes, key } = ctx.action.params;

      const filePath = (() => {
        if (key) {
          const tmpDir = os.tmpdir();
          return path.resolve(tmpDir, key);
        }

        if (filterByTk) {
          const dumper = new Dumper(ctx.app);
          return dumper.backUpFilePath(filterByTk);
        }
      })();

      if (!filePath) {
        throw new Error(`Backup file ${filterByTk} not found`);
      }

      const args = ['restore', '-f', filePath];

      for (const dataType of dataTypes) {
        args.push('-d', dataType);
      }

      await ctx.app.runCommand(...args);

      await next();
    },

    async destroy(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const dumper = new Dumper(ctx.app);
      const filePath = dumper.backUpFilePath(filterByTk);

      await fsPromises.unlink(filePath);

      // remove file
      ctx.body = {
        status: 'ok',
      };
      await next();
    },

    async upload(ctx, next) {
      const file = ctx.file;
      const fileName = file.filename;

      const restorer = new Restorer(ctx.app, {
        backUpFilePath: file.path,
      });

      const restoreMeta = await restorer.parseBackupFile();

      ctx.body = {
        key: fileName,
        meta: restoreMeta,
      };

      await next();
    },

    async dumpableCollections(ctx, next) {
      ctx.withoutDataWrapping = true;

      const dumper = new Dumper(ctx.app);

      const dumpableCollections = (await dumper.dumpableCollections()).map((c) => {
        return {
          name: c.name,
          dataType: c.dataType,
          origin: c.origin,
          title: c.title,
        };
      });

      ctx.body = _(dumpableCollections)
        .groupBy('dataType')
        .mapValues((items) => _.sortBy(items, (item) => item.origin.name))
        .value();

      await next();
    },
  },
};