import { Research, User } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import prisma from "../../prisma";
import { builder_config, builder_config_list } from "../datacenter/builder_config";
import { icotransl_list } from "../datacenter/resources_translator";
import { Send_Message_Universal } from "../../../module/fab/helper";

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
            keyboard.callbackButton({ label: `${icotransl_list['research'].smile} ${builder.name}`, payload: { command: 'research_controller', selector: builder.name }, color: 'secondary' }).row()
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
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Research_Controller(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Меню исследований для технологии ${context.eventPayload.selector}, у вас ${user.research.toFixed(2)}${icotransl_list['research'].smile}:\n\n`
    const research: Research | null | { lvl: number } = await prisma.research.findFirst({ where: { id_user: user.id, name: context.eventPayload.selector } }) || { lvl: 10 }
    const limapro = context.eventPayload.limapro ?? 1
    const lvls_upper = user.research >= limapro ? research.lvl+limapro : Math.floor(research.lvl+user.research)
    if (context.eventPayload.selector && context.eventPayload.status) {
        const research = await prisma.research.findFirst({ where: { id_user: user.id, name: context.eventPayload.selector } }) ? await prisma.research.findFirst({ where: { id_user: user.id, name: context.eventPayload.selector } }) : await prisma.research.create({ data: { id_user: user.id, name: context.eventPayload.selector, lvl: 10 } })
        
        if (research && user.research >= lvls_upper-research.lvl && user.research >= 1) {
            await prisma.$transaction([
                prisma.research.update({ where: { id: research.id }, data: { lvl: lvls_upper } }),
                prisma.user.update({ where: { id: user.id }, data: { research: { decrement: lvls_upper-research.lvl } } })
            ]).then(([builder_new, user_up]) => {
                event_logger = `⌛ Выполнено исследование технологии ${builder_new.name} с ${research.lvl} до ${builder_new.lvl} уровня.\n Остаток: ${user_up.research.toFixed(2)} ${icotransl_list['research'].smile}` 
                console.log(`⌛ Поздравляем ${user.idvk} с исследование технологии ${builder_new.name} с ${research.lvl} до ${builder_new.lvl} уровня.\n Остаток: ${user_up.research.toFixed(2)} ${icotransl_list['research'].smile}`)
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка исследования технологии, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });

        } else {
            event_logger = `⌛ Для исследований нужно ${icotransl_list['research'].smile} их производят в лабораториях`
        }
    } else {
        event_logger += `❄ Выберите количество уровней для исследования технологии ${context.eventPayload.selector}:\n\n Сейчас вы хотите прокачать с ${research?.lvl ?? 10} до ${lvls_upper} уровня`
        keyboard.callbackButton({ label: 'ОК', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: limapro, status: "ok" }, color: 'secondary' })
        keyboard.callbackButton({ label: 'Хочу x2', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 2 }, color: 'secondary' }).row()
        keyboard.callbackButton({ label: 'Хочу x5', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 5 }, color: 'secondary' })
        keyboard.callbackButton({ label: 'Хочу x10', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 10 }, color: 'secondary' }).row()
        keyboard.callbackButton({ label: 'Хочу x25', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 25 }, color: 'secondary' })
        keyboard.callbackButton({ label: 'Хочу x50', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 50 }, color: 'secondary' }).row()
        keyboard.callbackButton({ label: 'Хочу x75', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 75 }, color: 'secondary' })
        keyboard.callbackButton({ label: 'Хочу x100', payload: { command: 'research_controller', selector: context.eventPayload.selector, limapro: 100 }, color: 'secondary' }).row()
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'research_control' }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}