import { ACTIONS } from '../../constants.config';
import db from '../../indexedDBManager.js';

export default async function handleSystemEvent(msg) {
    
    switch(msg.action) {
        case ACTIONS.CONNECT: {
            const stateDB = await db.get();
            return { status: 'ok', msg: stateDB };
        }
    }
}