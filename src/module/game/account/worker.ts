import { Builder, User, Worker } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import Generator_Nickname from "../../fab/generator_name";
import { Rand_Int } from "../../fab/random";

function Finder_Builder(builder_list: Builder[], worker: Worker) {
    for (let i=0; i < builder_list.length; i++) {
        if (worker.id_builder == builder_list[i].id) {
            
            return builder_list[i]
        }
    }
    return null
}
export async function Worker_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const worker_list: Worker[] = await prisma.worker.findMany({ where: { id_user: user.id } })
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id } })
    let event_logger = ``
    let i = context.eventPayload.office_current ?? 0
    if (worker_list.length > 0) {
        event_logger += worker_list.map((worker: Worker) => {
            let builder: Builder | null = Finder_Builder(builder_list, worker)
            keyboard.callbackButton({ label: `💬 ${worker.name}-${worker.id}`, payload: { command: 'worker_control' }, color: 'secondary' })
            .callbackButton({ label: '🔧', payload: { command: 'worker_controller', command_sub: 'worker_upgrade', office_current: i, target: worker.id  }, color: 'secondary' })
            .callbackButton({ label: '👣', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: i, target: worker.id }, color: 'secondary' })
            .callbackButton({ label: '🔥', payload: { command: 'worker_controller', command_sub: 'worker_destroy', office_current: i, target: worker.id }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'worker_controller', command_sub: 'worker_open', office_current: i, target: worker.id }, color: 'secondary' }).row()
            return `💬 Работник: ${worker.name}-${worker.id}\n📈 Уровень: ${worker.lvl}\n📗 Опыт: ${worker.xp.toFixed(2)}\n⚡ Прибыль: ${worker.income.toFixed(2)}\n🧭 Скорость работы: ${worker.speed.toFixed(2)}\n🤑 Зарплата: ${worker.salary.toFixed(2)}\n💰 Заработано: ${worker.gold.toFixed(2)}\n🤝 Отношение к боссу: ${worker.reputation.toFixed(2)}\n⭐ Очки обучения: ${worker.point}\n👣 Место работы: ${builder ? `${builder.name}-${builder.id}` : `Фриланс`}\n`;
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
        'worker_target': Worker_Target,
        'worker_config': Worker_Config,
        'worker_destroy': Worker_Destroy,
        'worker_open': Worker_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Worker_Target(context: Context, user: User, target: number) {
    //let attached = await Image_Random(context, "beer")
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id } })
    const keyboard = new KeyboardBuilder()
    let event_logger = `Выберите новое место работы для вашего работника: \n\n`
    if (context.eventPayload.selector) {
        await prisma.$transaction([
            prisma.worker.update({ where: { id: target }, data: { id_builder: context.eventPayload.selector } }),
            prisma.builder.findFirst({ where: { id: context.eventPayload.selector }})
        ]).then(([worker_upd, builder]) => {
            event_logger = `⌛ Рабочий ${worker_upd.name}-${worker_upd.id} теперь работает в здании ${builder?.name}-${builder?.id}.\n` 
            console.log(`⌛ Рабочий игрока ${user.idvk} ${worker_upd.name}-${worker_upd.id} теперь работает в здании ${builder?.name}-${builder?.id}.`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка изменения места работы для работника, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    } else {
        if (builder_list.length > 0) {
            event_logger += builder_list.map((builder: Builder) => {
                keyboard.callbackButton({ label: `💬 ${builder.name}-${builder.id}`, payload: { command: 'worker_control' }, color: 'secondary' })
                .callbackButton({ label: '✅', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: 0, target: target, selector: builder.id }, color: 'secondary' }).row()
                return `💬 Имя: ${builder.name}-${builder.id}\n`;
            }).join('\n');
        } else {
            event_logger = `В данный момент нет доступных целей...`
        }
        
    }

    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
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
    const worker: Worker | null = await prisma.worker.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент рабочую силу нельзя улучшить...`
    if (worker && worker.point > 0) {
        const selector = await Rand_Int(2)

        const speed_new = selector == 0 ? 0.01 : 0
        const income_new = selector == 1 ? 0.1 : 0
        await prisma.$transaction([
            prisma.worker.update({ where: { id: worker.id }, data: { income: { increment: income_new }, speed: { increment: speed_new }, point: { decrement: 1 } } }),
            prisma.user.update({ where: { id: user.id }, data: { xp: { increment: Math.random() } } })
        ]).then(([worker_up, user_up]) => {
            event_logger = `⌛ Поздравляем с улучшением рабочего ${worker_up.name}-${worker_up.id}, ${selector == 0 ? `скорость повышена с ${worker.speed} до ${worker_up.speed}` : `прибыль повышена с ${worker.income.toFixed(2)} до ${worker_up.income.toFixed(2)}`}.\n🏦 Ваш опыт вырос с ${user.xp.toFixed(2)} до ${user_up.xp.toFixed(2)}` 
            console.log(`⌛ Поздравляем ${user.idvk} с улучшением рабочего ${worker_up.name}-${worker_up.id}, ${selector == 0 ? `скорость повышена с ${worker.speed} до ${worker_up.speed}` : `прибыль повышена с ${worker.income.toFixed(2)} до ${worker_up.income.toFixed(2)}`}.\n🏦 Его/ее опыт вырос с ${user.xp.toFixed(2)} до ${user_up.xp.toFixed(2)}`);
            //keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка прокачки рабочего, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const worker: Worker | null = await prisma.worker.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент некого уволить...`
    if (worker) {
        const worker_check: number = await prisma.worker.count({ where: { id_user: user.id }})
        const price_return = (worker_check)*50 >= 500 ? 500 : (worker_check)*50
        await prisma.$transaction([
            prisma.worker.delete({ where: { id: worker.id } }),
            prisma.user.update({ where: { id: user.id }, data: { gold: { increment: price_return } } })
        ]).then(([worker_del, user_return]) => {
            event_logger = `⌛ Поздравляем с увольнением работника ${worker_del.name}-${worker_del.id}.\n💳 На вашем счете было ${user.gold.toFixed(2)}₪, начислено ${price_return.toFixed(2)} шекелей, остаток: ${user_return.gold.toFixed(2)}💰` 
            console.log(`⌛ Поздравляем ${user.idvk} с увольнением работника ${worker_del.name}-${worker_del.id}.\n💳 На его/ее счете было ${user.gold.toFixed(2)}₪, начислено ${price_return.toFixed(2)} шекелей, остаток: ${user_return.gold.toFixed(2)}💰`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка увольнения работника, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
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