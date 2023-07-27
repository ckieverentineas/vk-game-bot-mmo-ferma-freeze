import { User, Builder } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

export async function Builder_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id } })
    let event_logger = ``
    let i = context.eventPayload.office_current ?? 0
    if (builder_list.length > 0) {
        event_logger += builder_list.map(builder => {
            keyboard.callbackButton({ label: `💬 ${builder.name}-${builder.id}`, payload: { command: 'builder_control' }, color: 'secondary' }).row()
            .callbackButton({ label: 'Улучшить', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: i, target: builder.id  }, color: 'secondary' }).row()
            .callbackButton({ label: 'Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy', office_current: i, target: builder.id }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
            return `💬 Здание: ${builder.name}-${builder.id}\n📈 Уровень: ${builder.lvl}\n📗 Опыт: ${builder.xp.toFixed(2)}\n💰 Вложено: ${builder.cost.toFixed(2)}\n⚡ Прибыль: ${builder.income.toFixed(2)}\n👥 Рабочих: ${builder.worker}\n⚒ Количество: ${builder.count}\n`;
        }).join('\n');
    } else {
        event_logger = `💬 Вы еще не зарегистрировали офис, как насчет открыть свое дело впервые?`
    }
    //новый офис
    if (builder_list.length == 0) {
        keyboard.callbackButton({ label: '➕', payload: { command: 'builder_controller', command_sub: 'builder_add' }, color: 'secondary' })
    }
    /*
    //предыдущий офис
    if (builder_list.length > 1 && i > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'office', office_current: i-1, target: office[i].id }, color: 'secondary' })
    }
    //следующий офис
    if (builder_list.length > 1 && i < builder_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'office', office_current: i+1, target: office[i].id }, color: 'secondary' })
    }
    */
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Builder_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'builder_add': Builder_Add,
        'builder_upgrade': Builder_Upgrade, 
        'builder_config': Office_Config,
        'builder_destroy': Builder_Destroy,
        'builder_open': Office_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Builder_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office_check: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, name: "Офис" }})
    let event_logger = `В данный момент нельзя ничего приобрести...`
    const prices = 100
    if (!office_check && user.gold >= prices) {
        await prisma.$transaction([
            prisma.builder.create({ data: { id_user: user.id, name: "Офис" } }),
            prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: prices } } })
        ]).then(([builder_new, user_pay]) => {
            event_logger = `⌛ Поздравляем с приобритением ${builder_new.name}-${builder_new.id}.\n🏦 На вашем счете было ${user.gold.toFixed(2)} шекелей, снято ${prices.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}` 
            console.log(`⌛ Поздравляем ${user.idvk} с приобритением ${builder_new.name}-${builder_new.id}.\n🏦 На его/ее счете было ${user.gold.toFixed(2)} шекелей, снято ${prices.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка приобретения нового здания, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент здание нельзя улучшить...`
    if (builder) {
        const lvl_new = builder.lvl+1
        const price_new = 102.5616*(lvl_new**1.3838)
        const worker_new = lvl_new/2 >= 1 ? Math.floor(lvl_new/2) : 1
        const income_new = 5*(lvl_new**1.5)
        if (user.gold >= price_new) {
            await prisma.$transaction([
                prisma.builder.update({ where: { id: builder.id }, data: { lvl: lvl_new, worker: worker_new, income: income_new, cost: { increment: price_new } } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: price_new } } })
            ]).then(([builder_up, user_up]) => {
                event_logger = `⌛ Поздравляем с улучшением уровня здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n🏦 На вашем счете было ${user.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_up.gold.toFixed(2)}` 
                console.log(`⌛ Поздравляем ${user.idvk} с улучшением здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n🏦 На его/ее счете было ${user.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_up.gold.toFixed(2)}`);
                //keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка прокачки здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger += `\n На вашем банковском счете недостает ${(price_new-user.gold).toFixed(2)} шекелей.`
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент нельзя снести здания...`
    if (builder) {
        if (context.eventPayload.status == "ok") {
            const price_return = 37.7385*(2.6158**builder.lvl)
            await prisma.$transaction([
                prisma.builder.delete({ where: { id: builder.id } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { increment: price_return } } })
            ]).then(([builder_del, user_return]) => {
                event_logger = `⌛ Поздравляем с разрушением здания ${builder_del.name}-${builder_del.id}.\n💳 На вашем счете было ${user.gold.toFixed(2)}₪, начислено ${price_return.toFixed(2)} шекелей, остаток: ${user_return.gold.toFixed(2)}💰` 
                console.log(`⌛ Поздравляем ${user.idvk} с разрушением здания ${builder_del.name}-${builder_del.id}.\n💳 На его/ее счете было ${user.gold.toFixed(2)}₪, начислено ${price_return.toFixed(2)} шекелей, остаток: ${user_return.gold.toFixed(2)}💰`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка разрушения здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `Вы уверены, что хотите снести ${builder.name}-${builder.id}?`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'builder_controller', command_sub: 'builder_destroy', office_current: 0, target: builder.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Config(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент офисом нельзя управлять...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Office_Open(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент в офис нельзя заглянуть...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}