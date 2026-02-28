import { ACTIONS } from '../../constants.config';
import db from '../../indexedDBManager.js';

export default async function handleSystemEvent(msg) {
    
    switch(msg.action) {
        case ACTIONS.CONNECT: {
            return { status: 'ok', msg: "Conexión establecida correctamente" };
        }
        
        case ACTIONS.ASYNC_CONFIG: {
            const stateDB = await db.get();
            return { status: 'ok', msg: stateDB };
        }
    }
}