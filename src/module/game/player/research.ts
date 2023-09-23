import { Research, User } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { builder_config, builder_config_list } from "../datacenter/builder_config";
import { icotransl_list } from "../datacenter/resources_translator";

export async function Research_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите технологию для исследования:\n\n`
    const cur = context.eventPayload.target_current || 0
    if (context.eventPayload.selector) {
        const research = await prisma.research.findFirst({ where: { id_user: user.id, name: context.eventPayload.selector } }) ? await prisma.research.findFirst({ where: { id_user: user.id, name: context.eventPayload.selector } }) : await prisma.research.create({ data: { id_user: user.id, name: context.eventPayload.selector, lvl: 10 } })
        if (research && user.research >= 1) {
            await prisma.$transaction([
                prisma.research.update({ where: { id: research.id }, data: { lvl: { increment: 1 } } }),
                prisma.user.update({ where: { id: user.id }, data: { research: { decrement: 1 } } })
            ]).then(([builder_new, user_up]) => {
                event_logger = `⌛ Выполнено исследование технологии ${builder_new.name} с ${research.lvl} до ${builder_new.lvl} уровня.\n Остаток: ${user_up.research.toFixed(2)} ${icotransl_list['research'].smile}` 
                console.log(`⌛ Поздравляем ${user.idvk} с исследование технологии ${builder_new.name} с ${research.lvl} до ${builder_new.lvl} уровня.\n Остаток: ${user_up.research.toFixed(2)} ${icotransl_list['research'].smile}`)
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка исследования технологии, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });

        } else {
            event_logger = `⌛ Для исследований нужно ${icotransl_list['research']} их производят в лабораториях`
        }
    } else {
        const limiter = 5
        let counter = 0
        
        for (let i=cur; i < builder_config_list.length && counter < limiter; i++) {
            const builder = builder_config[builder_config_list[i]]
            keyboard.callbackButton({ label: `${icotransl_list['research'].smile} ${builder.name}`, payload: { command: 'research_control', selector: builder.name }, color: 'secondary' }).row()
            const research: Research | null = await prisma.research.findFirst({ where: { id_user: user.id, name: builder.name } })
            event_logger += `\n\n💬 Технология: ${builder.name}\n ${builder.description}\n📝 Уровень: ${research?.lvl || 10 }`;
            counter++
        }
        event_logger += `\n\n${builder_config_list.length > 1 ? `~~~~ ${builder_config_list.length > limiter ? cur+limiter : limiter-(builder_config_list.length-cur)} из ${builder_config_list.length} ~~~~` : ''}`
        //предыдущий офис
        if (builder_config_list.length > limiter && cur > limiter-1) {
            keyboard.callbackButton({ label: '←', payload: { command: 'research_control', office_current: 0, target_current: cur-limiter }, color: 'secondary' })
        }
        //следующий офис
        if (builder_config_list.length > limiter && cur < builder_config_list.length-limiter) {
            keyboard.callbackButton({ label: '→', payload: { command: 'research_control', office_current: 0, target_current: cur+limiter }, color: 'secondary' })
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu', office_current: 0 }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}