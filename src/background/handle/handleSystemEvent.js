import { ACTIONS } from '../../constants.config';

export default async function handleSystemEvent(msg) {
    switch(msg.action) {
        case ACTIONS.CONNECT: {
            return { status: 'Conexión establecida' };
        }
    }
}