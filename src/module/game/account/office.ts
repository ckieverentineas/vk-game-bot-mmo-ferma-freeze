import { Office, User } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../../";
import prisma from "../../prisma";

export async function Office(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const office: Office[] = await prisma.office.findMany({ where: { id_user: user.id }, include: { Factory: true } })
    let event_logger = ``
    let i = context.eventPayload.office_current ?? 0
    if (office.length > 0) {
        event_logger = `💬 Ваш офис, ${office[i].id}:\n📈 Уровень: ${office[i].lvl}\n📗 Опыт: ${office[i].xp.toFixed(2)}`
        keyboard.callbackButton({ label: '🔧', payload: { command: 'office_controller', command_sub: 'office_upgrade', office_current: i, target: office[i].id  }, color: 'secondary' })
        .callbackButton({ label: '⚙', payload: { command: 'office_controller', command_sub: 'office_config', office_current: i, target: office[i].id }, color: 'secondary' })
        .callbackButton({ label: '🔥', payload: { command: 'office_controller', command_sub: 'office_destroy', office_current: i, target: office[i].id }, color: 'secondary' })
        .callbackButton({ label: '👀', payload: { command: 'office_controller', command_sub: 'office_open', office_current: i, target: office[i].id }, color: 'secondary' }).row()
    } else {
        event_logger = `💬 Вы еще не зарегистрировали офис, как насчет открыть свое дело впервые?`
    }
    //новый офис
    if (office.length == 0 || user.gold >= Math.sqrt(office.length*1000000+100)) {
        keyboard.callbackButton({ label: '➕', payload: { command: 'office_controller', command_sub: 'office_add', office_current: i, target: office[i]?.id ?? 0 }, color: 'secondary' })
    }
    //предыдущий офис
    if (office.length > 1 && i > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'office', office_current: i-1, target: office[i].id }, color: 'secondary' })
    }
    //следующий офис
    if (office.length > 1 && i < office.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'office', office_current: i+1, target: office[i].id }, color: 'secondary' })
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'user_info', office_current: i, target: office[i]?.id ?? 0 }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Office_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'office_add': Office_Add,
        'office_upgrade': Office_Upgrade, 
        'office_config': Office_Config,
        'office_destroy': Office_Destroy,
        'office_open': Office_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Office_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office_counter: number = await prisma.office.count({ where: { id_user: user.id }})
    const price = Math.sqrt(office_counter*1000000+100)
    let event_logger = `В данный момент новый офис не приобрести...`
    if (user.gold >= price) {
        await prisma.$transaction([
            prisma.office.create({ data: { id_user: user.id } }),
            prisma.user.update({ where: { id: user.id }, data: { gold: user.gold - price }})
        ]).then(([office_new, user_pay]) => {
            event_logger = `⌛ Поздравляем с приобритением офиса ${office_new.id}.\n💳 На вашем счете было ${user.gold.toFixed(2)}₪, снято ${price.toFixed(2)} шекелей, остаток: ${user_pay.gold.toFixed(2)}💰` 
            console.log(`⌛ Поздравляем ${user.idvk} с приобритением офиса ${office_new.id}.\n💳 На его счете было ${user.gold.toFixed(2)}₪, снято ${price.toFixed(2)} шекелей, остаток: ${user_pay.gold.toFixed(2)}💰`);
            keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: office_counter, target: office_new.id }, color: 'secondary' })
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка покупки нового офиса, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Office | null = await prisma.office.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент офис нельзя улучшить...`
    if (office) {
        const price = Math.sqrt(office.xp*1000000+100)
        
        if (office.xp >= price) {
            await prisma.$transaction([
                prisma.office.update({ where: { id: office.id }, data: { xp: office.xp - price, lvl: { increment: 1 } } }),
            ]).then(([office_upgrade]) => {
                event_logger = `⌛ Поздравляем с улучшением офиса ${office_upgrade.id} с ${office.lvl} на ${office_upgrade.lvl}.\n🏦 На его счете было ${office.xp.toFixed(2)} XP, снято ${price.toFixed(2)} опыта, остаток: ${office_upgrade.xp.toFixed(2)}📗` 
                console.log(`⌛ Поздравляем ${user.idvk} с улучшением офиса ${office_upgrade.id} с ${office.lvl} на ${office_upgrade.lvl}.\n🏦 На его счете было ${office.xp.toFixed(2)} XP, снято ${price.toFixed(2)} опыта, остаток: ${office_upgrade.xp.toFixed(2)}📗`);
                keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка прокачки офиса, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office_counter: number = await prisma.office.count({ where: { id_user: user.id }})
    const price = Math.sqrt((office_counter)*1000000+100)*1.0
    let event_logger = `В данный момент новый офис не приобрести...`
    if (office_counter > 0) {
        await prisma.$transaction([
            prisma.office.delete({ where: { id: target } }),
            prisma.user.update({ where: { id: user.id }, data: { gold: user.gold + price }})
        ]).then(([office_new, user_pay]) => {
            event_logger = `⌛ Поздравляем с разрушением офиса ${office_new.id}.\n💳 На вашем счете было ${user.gold.toFixed(2)}₪, начислено ${price.toFixed(2)} шекелей, остаток: ${user_pay.gold.toFixed(2)}💰` 
            console.log(`⌛ Поздравляем ${user.idvk} с разрушением офиса ${office_new.id}.\n💳 На его счете было ${user.gold.toFixed(2)}₪, начислено ${price.toFixed(2)} шекелей, остаток: ${user_pay.gold.toFixed(2)}💰`);
            keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: office_counter > 1 ? office_counter-2 : 0, target: undefined }, color: 'secondary' })
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка разрушения офиса, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Config(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Office | null = await prisma.office.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент офисом нельзя управлять...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Open(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Office | null = await prisma.office.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент в офис нельзя заглянуть...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}