import {
  KiipDatabase,
  createKiipCallbackSync,
  createKiipPromise,
  KiipFragment,
  KiipDocument
} from '@kiip/core';

export type Transaction = null;

export function KiipMemoryDb(): KiipDatabase<Transaction> {
  let db: {
    fragments: Array<KiipFragment>;
    documents: Array<KiipDocument<unknown>>;
  } = {
    fragments: [],
    documents: []
  };

  return {
    withTransaction(exec) {
      return createKiipPromise(resolve => {
        return exec(null, val => {
          return resolve(val);
        });
      });
    },
    addDocument(_tx, document, onResolve) {
      return createKiipCallbackSync(() => {
        db.documents.push(document);
      }, onResolve);
    },
    addFragments(_tx, fragments, onResolve) {
      return createKiipCallbackSync(() => {
        db.fragments.push(...fragments);
      }, onResolve);
    },
    getDocument(_, documentId, onResolve) {
      return createKiipCallbackSync(() => {
        const doc = db.documents.find(doc => doc.id === documentId);
        if (!doc) {
          return;
        }
        return doc;
      }, onResolve);
    },
    getDocuments(_, onResolve) {
      return createKiipCallbackSync(() => {
        return db.documents;
      }, onResolve);
    },
    getFragmentsSince(_, documentId, timestamp, skipNodeId, onResolve) {
      return createKiipCallbackSync(() => {
        const tsStr = timestamp.toString();
        const frags: Array<KiipFragment> = [];
        db.fragments.forEach(frag => {
          if (frag.documentId !== documentId) {
            return;
          }
          if (frag.timestamp.endsWith(skipNodeId)) {
            return;
          }
          if (frag.timestamp > tsStr) {
            frags.push(frag);
          }
        });
        return frags;
      }, onResolve);
    },
    onEachFragment(_, documentId, onFragment, onResolve) {
      return createKiipCallbackSync(() => {
        const frags = db.fragments.filter(frag => frag.documentId === documentId);
        frags.forEach(frag => {
          onFragment(frag);
        });
      }, onResolve);
    },
    setMetadata(_, documentId, meta, onResolve) {
      return createKiipCallbackSync(() => {
        db = {
          ...db,
          documents: db.documents.map(doc => {
            if (doc.id !== documentId) {
              return doc;
            }
            return {
              ...doc,
              meta
            };
          })
        };
      }, onResolve);
    }
  };
}
