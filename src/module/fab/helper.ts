import { vk } from "../../index";
import { Keyboard, PhotoAttachment } from "vk-io";

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export async function Send_Message(idvk: number, message: string, keyboard?: Keyboard) {
    message = message ? message : 'invalid message'
    try {
        keyboard ? await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard } ) : await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}` } )
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}

export async function Send_Message_Universal(idvk: number, message: string, keyboard?: Keyboard, attachment?: string | PhotoAttachment | null) {
    message = message ? message : 'invalid message'
    try {
        if (!attachment && !keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}` } ) }
        if (attachment && !keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, attachment: attachment } ) }
        if (!attachment && keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard } ) }
        if (attachment && keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard, attachment: attachment } ) }
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}