import log from 'electron-log';
import imageDB from './db';

const { ipcRenderer } = require('electron');

export const openDBConnection = () => {
  // dexie documentation:
  // Even though open() is asynchronous,
  // you can already now start interact with the database.
  // The operations will be pending until open() completes.
  // If open() succeeds, the operations below will resume.
  // If open() fails, the below operations below will fail and
  if (!imageDB.isOpen()) {
    imageDB.open().catch(err => {
      log.error(`Failed to open imageDB: ${err.stack || err}`);
    });
  }
};

export const deleteTableFramelist = () =>
  imageDB.frameList.clear().catch(err => {
    log.error(`Failed to delete all objects in frameList: ${err.stack || err}`);
  });

export const addFrameToIndexedDB = (frameId, fileId, frameNumber, outBase64, objectUrlQueue) => {
  const url = `data:image/jpg;base64,${outBase64}`;
  return fetch(url)
    .then(res => res.blob())
    .then(blob => {
      try {
        return imageDB
          .transaction('rw', imageDB.frameList, async () => {
            await imageDB.frameList.put({
              frameId,
              fileId,
              frameNumber,
              data: blob,
            });
            const key = await imageDB.frameList.get(frameId);
            // console.log(key);
            return key;
          })
          .catch(e => {
            log.error('error inside addFrameToIndexedDB - transaction');
            log.error(e.stack || e);
          });
      } catch (e) {
        log.error(e.stack || e);
        return undefined;
      }
    })
    .then(frame => {
      // console.log(frame);
      const objectUrl = window.URL.createObjectURL(frame.data);
      objectUrlQueue.add({
        frameId,
        objectUrl,
      });
      return objectUrl;
    })
    .catch(e => {
      log.error(e.stack || e);
    });
};

export const updateFrameInIndexedDB = (frameId, outBase64, objectUrlQueue, fastTrack) => {
  if (outBase64 === '') {
    return undefined;
  }
  const url = `data:image/jpg;base64,${outBase64}`;
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      return imageDB
        .transaction('rw', imageDB.frameList, async () => {
          await imageDB.frameList
            .where('frameId')
            .equals(frameId)
            .modify({
              data: blob,
            });
          const key = await imageDB.frameList.get(frameId);
          console.log(key);
          return key;
        })
        .then(key => {
          console.log('Transaction committed');
          return key;
        })
        .catch(e => {
          log.error('error inside updateFrameInIndexedDB - transaction');
          log.error(e.stack || e);
        });
    })
    .then(frame => {
      console.log(frame);
      if (frame !== undefined) {
        const objectUrl = window.URL.createObjectURL(frame.data);
        if (fastTrack) {
          ipcRenderer.send('message-from-indexedDBWorkerWindow-to-mainWindow', 'update-objectUrl', frameId, objectUrl);
        } else {
          objectUrlQueue.add({
            frameId,
            objectUrl,
          });
        }
        return objectUrl;
      }
      return undefined;
    })
    .catch(e => {
      log.error(e.stack || e);
    });
};

export const getObjectUrlsFromFramelist = objectUrlQueue => {
  console.log('inside getObjectUrlsFromFramelist');
  try {
    log.warn(imageDB.isOpen());
    imageDB
      .transaction('r', imageDB.frameList, async () => {
        try {
          console.log(imageDB.isOpen());
          const array = await imageDB.frameList.toArray().catch(e => {
            log.error('error inside promise catch');
            log.error(e.stack || e);
          });
          if (array.length === 0) {
            return [];
          }
          const arrayOfObjectUrls = [];
          array.map(frame => {
            const objectUrl = window.URL.createObjectURL(frame.data);
            if (objectUrl !== undefined) {
              arrayOfObjectUrls.push({
                frameId: frame.frameId,
                objectUrl: window.URL.createObjectURL(frame.data),
              });
            }
            return undefined;
          });
          objectUrlQueue.addArray(arrayOfObjectUrls);
          return undefined;
        } catch (e) {
          log.error('error inside the inner try catch');
          log.error(e.stack || e);
        }
      })
      .catch(e => {
        log.error('error inside promise catch');
        log.error(e.stack || e);
      });
  } catch (e) {
    log.error('error inside try catch');
    log.error(e.stack || e);
  }
};
