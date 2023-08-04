import { User, Builder } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

const buildin: { [key: string]: { price: number, income: number, cost: number, koef_price: number, koef_income: number, type: string, smile: string, description: string } } = {
    "Офис": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'gold', smile: '💰', description: "Офис является штабом вашего бизнеса и фискирует прибыль в шекелях" },
    "Электростанция": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'energy', smile: '⚡', description: "Электростанция является источником энергии для вашего бизнеса в виде энергии" }
}

export async function Builder_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id } })
    let event_logger = `❄ Отдел управления сооружениями:\n\n`
    let cur = context.eventPayload.office_current ?? 0
    const builder = builder_list[cur]
    if (builder_list.length > 0) {
        const sel = buildin[builder.name]
        const lvl_new = builder.lvl+1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        keyboard.callbackButton({ label: `🔧 ${price_new.toFixed(2)}💰`, payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id  }, color: 'secondary' }).row()
        .callbackButton({ label: '💥 Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy', office_current: cur, target: builder.id }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        event_logger +=`💬 Здание: ${builder.name}-${builder.id}\n📈 Уровень: ${builder.lvl}\n📗 Опыт: ${builder.xp.toFixed(2)}\n💰 Вложено: ${builder.cost.toFixed(2)}\n${buildin[builder.name].smile} Прибыль: ${builder.income.toFixed(2)}\n👥 Рабочих: ${builder.worker}\n⚒ Количество: ${builder.count}\n\n${builder_list.length > 1 ? `~~~~ ${1+cur} из ${builder_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не построили здания, как насчет что-то построить??`
    }
    
    //предыдущий офис
    if (builder_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'builder_control', office_current: cur-1, target: builder.id }, color: 'secondary' })
    }
    //следующий офис
    if (builder_list.length > 1 && cur < builder_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'builder_control', office_current: cur+1, target: builder.id }, color: 'secondary' })
    }
    //новый офис
    keyboard.callbackButton({ label: '➕', payload: { command: 'builder_controller', command_sub: 'builder_add' }, color: 'secondary' })
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
    let event_logger = `❄ Выберите новое здание для стройки:\n\n`
    if (context.eventPayload.selector) {
        const sel = buildin[context.eventPayload.selector]
        const lvl_new = 1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        const worker_new = lvl_new/10 >= 1 ? Math.floor(lvl_new/10) : 1
        const income_new = sel.income*(lvl_new**sel.koef_income)
        if (user.gold >= price_new) {
            await prisma.$transaction([
                prisma.builder.create({ data: { id_user: user.id, name: context.eventPayload.selector, income: income_new, worker: worker_new, cost: price_new, type: sel.type } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: price_new } } })
            ]).then(([builder_new, user_pay]) => {
                event_logger = `⌛ Поздравляем с приобритением ${builder_new.name}-${builder_new.id}.\n🏦 На вашем счете было ${user.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}` 
                console.log(`⌛ Поздравляем ${user.idvk} с приобритением ${builder_new.name}-${builder_new.id}.\n🏦 На его/ее счете было ${user.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка приобретения нового здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `⌛ На вашем банковском счете недостает ${(price_new-user.gold).toFixed(2)} шекелей для постройки нового здания.`
        }
    } else {
        for (const builder of ['Офис', 'Электростанция']) {
            const sel = buildin[builder]
            const lvl_new = 1
            const price_new = sel.price*(lvl_new**sel.koef_price)
            keyboard.callbackButton({ label: `➕ ${builder} ${price_new}💰`, payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, target: target, selector: builder }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder}\n${buildin[builder].smile} Прибыль: ${sel.income.toFixed(2)} в час\n ${sel.description}`;
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент здание нельзя улучшить...`
    let cur = context.eventPayload.office_current ?? 0
    if (builder) {
        const sel = buildin[builder.name]
        const lvl_new = builder.lvl+1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        const worker_new = lvl_new/10 >= 1 ? Math.floor(lvl_new/10) : 1
        const income_new = sel.income*(lvl_new**sel.koef_income)
        if (context.eventPayload.status == "ok") {
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
        } else {
            event_logger = `Вы уверены, что хотите улучшить здание ${builder.name}-${builder.id} за ${price_new.toFixed(2)} при балансе ${user.gold.toFixed(2)}💰?\n\n Параметры вырастут следующим образом:\n${buildin[builder.name].smile} Прибыль: ${builder.income.toFixed(2)} --> ${income_new.toFixed(2)}\n👥 Рабочих: ${builder.worker} --> ${worker_new}\n`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: cur, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент нельзя снести здания...`
    if (builder) {
        if (context.eventPayload.status == "ok") {
            const sel = buildin[builder.name]
            const lvl_new = builder.lvl
            const price_return = sel.price*(lvl_new**sel.koef_price)
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
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
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