import { Builder, User, Worker } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import Generator_Nickname from "../../fab/generator_name";

export async function Worker_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const worker_list: Worker[] = await prisma.worker.findMany({ where: { id_user: user.id } })
    let event_logger = ``
    let i = context.eventPayload.office_current ?? 0
    if (worker_list.length > 0) {
        event_logger += worker_list.map(worker => {
            keyboard.callbackButton({ label: `💬 ${worker.name}-${worker.id}`, payload: { command: 'worker_control' }, color: 'secondary' })
            //.callbackButton({ label: '🔧', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: i, target: builder.id  }, color: 'secondary' })
            .callbackButton({ label: '🔥', payload: { command: 'worker_controller', command_sub: 'worker_destroy', office_current: i, target: worker.id }, color: 'secondary' })
            .callbackButton({ label: '👀', payload: { command: 'worker_controller', command_sub: 'worker_open', office_current: i, target: worker.id }, color: 'secondary' }).row()
            return `💬 ${worker.name}-${worker.id}\n📈 ${worker.lvl}\n📗 ${worker.xp.toFixed(2)}\n⚡ ${worker.income.toFixed(2)}\n🧭 ${worker.speed.toFixed(2)}\n🤑 ${worker.salary.toFixed(2)}\n💰 ${worker.gold.toFixed(2)}\n🤝 ${worker.reputation.toFixed(2)}\n⭐ ${worker.point.toFixed(2)}\n`;
        }).join('\n');
    } else {
        event_logger = `💬 Вы еще не наняли рабочих, как насчет кого-то нанять?`
    }
    //новый офис
    if (worker_list.length == 0) {
        keyboard.callbackButton({ label: '➕', payload: { command: 'worker_controller', command_sub: 'worker_add' }, color: 'secondary' })
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

export async function Worker_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'worker_add': Worker_Add,
        'worker_upgrade': Worker_Upgrade, 
        'worker_config': Worker_Config,
        'worker_destroy': Worker_Destroy,
        'worker_open': Worker_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Worker_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const worker_check: number = await prisma.worker.count({ where: { id_user: user.id }})
    let event_logger = `В данный момент некого нанимать...`
    const prices = (worker_check+1)*50 >= 500 ? 500 : (worker_check+1)*50
    if (user.gold >= prices) {
        await prisma.$transaction([
            prisma.worker.create({ data: { id_user: user.id, name: await Generator_Nickname() } }),
            prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: prices } } })
        ]).then(([worker_new, user_pay]) => {
            event_logger = `⌛ Поздравляем с наниманием ${worker_new.name}-${worker_new.id}.\n🏦 На вашем счете было ${user.gold.toFixed(2)} шекелей, снято ${prices.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}` 
            console.log(`⌛ Поздравляем ${user.idvk} с наниманием ${worker_new.name}-${worker_new.id}.\n🏦 На его/ее счете было ${user.gold.toFixed(2)} шекелей, снято ${prices.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка нанимания нового работника, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент здание нельзя улучшить...`
    if (builder) {
        const lvl_new = builder.lvl+1
        const price_new = 37.7385*(2.6158**lvl_new)
        const worker_new = lvl_new
        const income_new = 0.7500*lvl_new**3-3.0357*lvl_new**2+7.2143*lvl_new-3.8000
        if (user.gold >= price_new) {
            await prisma.$transaction([
                prisma.builder.update({ where: { id: builder.id }, data: { lvl: lvl_new, worker: worker_new, income: income_new } }),
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
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент нечего продать...`
    if (builder) {
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
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Config(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент офисом нельзя управлять...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Open(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент в офис нельзя заглянуть...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}