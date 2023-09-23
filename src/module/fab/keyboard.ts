import { KeyboardBuilder } from "vk-io"

export async function Keyboard_Universal(data: any, command: string, id_current: number, elements: any) {
    const keyboard = new KeyboardBuilder()
    let event_logger = ''
    const limiter = 5
    let counter = 0
    for (let i=id_current; i < data.length && counter < limiter; i++) {
        const data_sel = data[i]
        keyboard.callbackButton({ label: `${data_sel.name}`, payload: { command: `${command}`, storage: elements, id_target: data_sel.id }, color: 'secondary' }).row()
        event_logger += `\n\n💬 ${data_sel.name}-${data_sel.id}`;
        counter++
    }
    event_logger += `\n\n${data.length > 1 ? `~~~~ ${id_current + data.length > id_current+limiter ? limiter : limiter-(data.length-id_current)} из ${data.length} ~~~~` : ''}`
    //предыдущий офис
    if (data.length > limiter && id_current > limiter-1) {
        keyboard.callbackButton({ label: '←', payload: { command: `${command}`, storage: elements, target_current: id_current-limiter }, color: 'secondary' })
    }
    //следующий офис
    if (data.length > limiter && id_current < data.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: `${command}`, storage: elements, target_current: id_current+limiter }, color: 'secondary' })
    }
    return { event_logger, keyboard }
}