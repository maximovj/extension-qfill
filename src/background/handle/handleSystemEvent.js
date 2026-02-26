import { ACTIONS } from '../../constants.config';
import IndexedDBManager from '../../indexedDBManager.js';

export default async function handleSystemEvent(msg) {
    const db = IndexedDBManager;
    
    switch(msg.action) {
        case ACTIONS.CONNECT: {
            const datos = await db.getAllData();
            return { status: 'ok', msg: datos };
        }
    }
}