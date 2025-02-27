import { Builder, User, Worker } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import prisma from "../../prisma";
import Generator_Nickname from "../../fab/generator_name";
import { Rand_Int } from "../../fab/random";
import { Send_Message, Send_Message_Universal } from "../../../module/fab/helper";

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
    const worker_list: Worker[] = await prisma.worker.findMany({ where: { id_user: user.id }, orderBy: { id_builder: "asc" } })
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id } })
    let event_logger = `❄ Отдел кадров:\n\n`
    let cur = context.eventPayload.office_current ?? 0
    const worker = worker_list[cur]
    if (worker_list.length > 0) {
        let builder: Builder | null = Finder_Builder(builder_list, worker)
        keyboard
        .callbackButton({ label: '🎓 Обучить', payload: { command: 'worker_controller', command_sub: 'worker_upgrade', office_current: cur, target: worker.id  }, color: 'secondary' }).row()
        //.callbackButton({ label: '👣 Место работы', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: cur, target: worker.id }, color: 'secondary' }).row()
        .callbackButton({ label: '💥 Уволить', payload: { command: 'worker_controller', command_sub: 'worker_destroy', office_current: cur, target: worker.id }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀 Авто ИИ', payload: { command: 'worker_controller', command_sub: 'worker_config', office_current: cur, target: worker.id }, color: 'secondary' }).row()
        event_logger +=`💬 Работник: ${worker.name}-${worker.id}\n📈 Уровень: ${worker.lvl}\n📗 Опыт: ${worker.xp.toFixed(2)}\n⚡ Прибыль: ${worker.income.toFixed(2)}\n🧭 Скорость работы: ${worker.speed.toFixed(3)}\n🤑 Зарплата: ${worker.salary.toFixed(2)}\n💰 Заработано: ${worker.gold.toFixed(2)}\n🤝 Отношение к боссу: ${worker.reputation.toFixed(2)}\n⭐ Очки обучения: ${worker.point}\n👣 Место работы: ${builder ? `${builder.name}-${builder.id}` : `Фриланс`}\n🌎 Геолокация: ${await prisma.planet.findFirst({ where: { id: worker.id_planet || -1 } }) ? `Планета-${worker.id_planet}` : 'Фиг знает'}\n\n${worker_list.length > 1 ? `~~~~ ${1+cur} из ${worker_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не наняли рабочих, как насчет кого-то нанять?`
    }
    //предыдущий офис
    if (worker_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'worker_control', office_current: cur-1, target: worker.id }, color: 'secondary' })
    }
    //следующий офис
    if (worker_list.length > 1 && cur < worker_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'worker_control', office_current: cur+1, target: worker.id }, color: 'secondary' })
    }
    if (worker_list.length > 5) {
        if ( cur < worker_list.length/2) {
            //последний офис
            keyboard.callbackButton({ label: '→🕯', payload: { command: 'worker_control', office_current: worker_list.length-1, target: worker.id }, color: 'secondary' })
        } else {
            //первый офис
            keyboard.callbackButton({ label: '←🕯', payload: { command: 'worker_control', office_current: 0, target: worker.id }, color: 'secondary' })
        }
    }
    //новый офис
    const worker_check: number = await prisma.worker.count({ where: { id_user: user.id }})
    const prices = (worker_check+1)*50 >= 500 ? 500 : (worker_check+1)*50
    keyboard.callbackButton({ label: `➕${prices}💰`, payload: { command: 'worker_controller', command_sub: 'worker_add' }, color: 'secondary' })
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
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
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id }, orderBy: { id: "desc" } })
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новое место работы для вашего работника: \n\n`
    const curva = context.eventPayload.office_current || 0
    const cur = context.eventPayload.target_current || 0
    if (context.eventPayload.selector || context.eventPayload.selector == 'zero') {
        //const worker_checker: number = await prisma.worker.count({ where: { id_builder: context.eventPayload.selector | 0 } })
        const id_build = context.eventPayload.selector == 'zero' ? 0 : context.eventPayload.selector
        const worker_checker: number = await prisma.worker.count({ where: { id_builder: id_build } })
        const builder = await prisma.builder.findFirst({ where: { id: id_build }})
        if (builder && worker_checker < 0/*limit*/ || context.eventPayload.selector == 'zero') {
            await prisma.$transaction([
                prisma.worker.update({ where: { id: target }, data: { id_builder: id_build } }),
            ]).then(([worker_upd]) => {
                event_logger = `⌛ Рабочий ${worker_upd.name}-${worker_upd.id} теперь работает ${context.eventPayload.selector == 'zero' ? 'на Фрилансе' : `в здании ${builder?.name}-${builder?.id}`}.\n` 
                console.log(`⌛ Рабочий игрока ${user.idvk} ${worker_upd.name}-${worker_upd.id} теперь работает в здании ${builder?.name}-${builder?.id}.`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка изменения места работы для работника, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger += `В здании ${builder!.name}-${builder!.id} уже работает ${worker_checker}/0👥 рабочих!`
        }
        
    } else {
        if (builder_list.length > 0) {
            const limiter = 5
            let counter = 0
            for (let i=cur; i < builder_list.length && counter < limiter; i++) {
                const builder = builder_list[i]
                //console.log(`cur: ${cur} i: ${i} counter: ${counter} ${JSON.stringify(builder)}`)
                if (counter < limiter) {
                    const worker_checker: number = await prisma.worker.count({ where: { id_builder: builder.id } })
                    keyboard.callbackButton({ label: `✅ ${worker_checker}/0👥 ${builder.name}-${builder.id}`, payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: cur, target: target, selector: builder.id }, color: 'secondary' }).row()
                    event_logger += `💬 Здание: ${builder.name}-${builder.id}\n`;
                }
                counter++
            }
            event_logger += `\n\n${builder_list.length > 1 ? `~~~~ ${cur + builder_list.length > cur+limiter ? cur : limiter-(builder_list.length-cur)} из ${builder_list.length} ~~~~` : ''}`
            //предыдущий офис
            if (builder_list.length > limiter && cur > limiter-1) {
                keyboard.callbackButton({ label: '←', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: cur-limiter, target: target }, color: 'secondary' })
            }
            //следующий офис
            if (builder_list.length > limiter && cur < builder_list.length-1) {
                keyboard.callbackButton({ label: '→', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: cur+limiter, target: target }, color: 'secondary' })
            }
            if (builder_list.length > 5) {
                if ( cur < builder_list.length/2) {
                    //последний офис
                    keyboard.callbackButton({ label: '→🕯', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: builder_list.length-6, target: target }, color: 'secondary' })
                } else {
                    //первый офис
                    keyboard.callbackButton({ label: '←🕯', payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: 0, target: target }, color: 'secondary' })
                }
            }
            keyboard.callbackButton({ label: `❌ Фриланс`, payload: { command: 'worker_controller', command_sub: 'worker_target', office_current: curva, target_current: cur, target: target, selector: 'zero' }, color: 'secondary' })
        } else {
            event_logger = `В данный момент нет доступных целей...`
        }
        
    }

    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: curva, target_current: cur, target: target }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
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
    } else {
        const worker_check: number = await prisma.worker.count({ where: { id_user: user.id }})
        const prices = (worker_check+1)*50 >= 500 ? 500 : (worker_check+1)*50
        event_logger = `⌛ На вашем банковском счете недостает ${(prices-user.gold).toFixed(2)} шекелей для нанимания нового кадра.`
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const worker: Worker | null = await prisma.worker.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент рабочую силу нельзя улучшить...`
    let cur = context.eventPayload.office_current ?? 0
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
    } else {
        event_logger += `\n У рабочего ${worker?.name} не хватает очков обучения. Очки обучения начисляются раз в день каждому рабочему в процессе сбора Прибыли.`
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: cur, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const worker: Worker | null = await prisma.worker.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент некого уволить...`
    if (worker) {
        if (context.eventPayload.status == "ok") {
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
        } else {
            event_logger = `Вы уверены, что хотите уволить рабочего ${worker.name}-${worker.id}?`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'worker_controller', command_sub: 'worker_destroy', office_current: 0, target: worker.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Config(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let counter_worker_fixed = 0
    for (const worker of await prisma.worker.findMany({ where: { id_user: user.id } })) {
        if (worker && worker.id_builder != 0) {
            const builder_check: Builder | null = await prisma.builder.findFirst({ where: { id: worker.id_builder || 0 } })
            if (!builder_check) {
                await prisma.worker.update({ where: { id: worker.id }, data: { id_builder: 0 } })
                counter_worker_fixed++
            }
        }
    }
    await Send_Message(user.idvk, `⚙ Обнаружено рабочих без места работы: ${counter_worker_fixed}`)
    let counter_builder_fixed = 0
    for (const builder of await prisma.builder.findMany({ where: { id_user: user.id } })) {
        if (builder) {
            const builder_check: number = await prisma.worker.count({ where: { id_builder: builder.id } })
            if (builder_check < 0/*builder.worker*/) {
                let need_worker = /*builder.worker*/ - builder_check
                for (const worker of await prisma.worker.findMany({ where: { id_user: user.id, id_builder: 0 } })) {
                    if (worker && worker.id_builder == 0 && need_worker > 0) {
                        await prisma.worker.update({ where: { id: worker.id }, data: { id_builder: builder.id } })
                        counter_builder_fixed++
                        need_worker--
                    }
                }
            }
        }
    }
    await Send_Message(user.idvk, `⚙ Назначено рабочих на места работы: ${counter_builder_fixed}`)
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'worker_control', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `Поиск безработных и назначение на работы автоматически успешно завершено!`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `Поиск безработных и назначение на работы автоматически успешно завершено!`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Worker_Open(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const office: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент в офис нельзя заглянуть...`
    if (office) {
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'office', office_current: context.eventPayload.office_current, target: target }, color: 'secondary' }).inline().oneTime() 
    await Send_Message_Universal(context.peerId, `${event_logger}`, keyboard)
    //await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}