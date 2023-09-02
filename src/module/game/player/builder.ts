import { User, Builder } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

export interface Builder_Init {
    builder: string;
    cost: Cost[];
    input?: Input[];
    output?: Output[];
    require: Require[];
    description: string;
}

export interface Builder_Set {
    builder: string;
    cost: Cost[];
    input?: Input[];
    output?: Output[];
    require: Require[];
    description: string;
}

export interface Cost_Set {
    name: string;
    count: number;
}

export interface Cost {
    name: string;
    count: number;
    koef: number;
}

export interface Input {
    name: string;
    income: number;
    koef: number | 'none';
    time: any;
}

export interface Output {
    name: string;
    outcome: number;
    koef: number;
    time: number;
}

export interface Require {
    name: string;
    limit: number;
    koef: number;
}

const buildin: Builder_Init[] = [
    { 
        builder: "Шахты",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'coal', income: 5, koef: 2, time: 3600000 },
            { name: 'gas', income: 50, koef: 1.5, time: 86400000 },
            { name: 'oil', income: 25, koef: 1.4, time: 86400000 },
            { name: 'slate', income: 10, koef: 1.3, time: 86400000 },
            { name: 'turf', income: 5, koef: 1.2, time: 86400000 },
            { name: 'uranium', income: 1, koef: 1.1, time: 86400000 },

            { name: 'iron', income: 5, koef: 1.5, time: 3600000 },
            { name: 'golden', income: 5, koef: 1.5, time: 3600000 },
            { name: 'artefact', income: 2, koef: 1.2, time: 86400000 },
            { name: 'crystal', income: 1, koef: 1.1, time: 86400000 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: "Шахты позволяют истощать ресурсы планет"
    },
    { 
        builder: "Электростанция",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'energy', income: 5, koef: 1.5, time: 3600000 },
        ],
        output: [
            { name: 'coal', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Электростанция потреБЛЯет преобразует добытый уголь в энергию'
    },
    { 
        builder: "Солнечная электростанция",
        cost: [
            { name: 'gold', count: 100000, koef: 1.3838 },
            { name: 'iron', count: 1000, koef: 1.3838 },
        ],
        input: [
            { name: 'energy', income: 5, koef: 1.5, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Солнечная электростанция преобразует энергию света в энергию'
    },
    { 
        builder: "Центробанк",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'gold', income: 5, koef: 1.5, time: 3600000 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
            { name: 'golden', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Центральный банк делает шекели из добытых золотых слитков'
    },
    {
        builder: "Археологический центр", 
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        output: [
            { name: 'artefact', outcome: 1, koef: 1.5, time: 86400000 },
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Археологический центр позволяет открывать артефакты, из которых могут выпасть даже площадки к планетам'
    },
    {
        builder: "Лаборатория",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Лаборатория позволяет производить исследования'
    },
    //"Утилизатор": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'gold', smile: '💰', description: "Офис является штабом вашего бизнеса и фискирует прибыль в шекелях" },
    {
        builder: "Города",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'worker', income: 5, koef: 1.4, time: 'none' },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Города - места где рабочие чилят'
    },
    {
        builder: "Склад",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'coal', income: 0, koef: 'none', time: 'none' },
            { name: 'gas', income: 0, koef: 'none', time: 'none' },
            { name: 'oil', income: 0, koef: 'none', time: 'none' },
            { name: 'slate', income: 0, koef: 'none', time: 'none' },
            { name: 'turf', income: 0, koef: 'none', time: 'none' },
            { name: 'uranium', income: 0, koef: 'none', time: 'none' },
            
            { name: 'iron', income: 0, koef: 'none', time: 'none' },
            { name: 'golden', income: 0, koef: 'none', time: 'none' },
            { name: 'artefact', income: 0, koef: 'none', time: 'none' },
            { name: 'crystal', income: 0, koef: 'none', time: 'none' },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 1.01 }
        ],
        description: 'Склад - хранилище для добытых ресурсов на планете'
    },
    //"Фабрика": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'energy', smile: '⚡', description: "Электростанция является источником энергии для вашего бизнеса в виде энергии" }
]

export async function Builder_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Отдел управления сооружениями:\n\n`
    let cur = context.eventPayload.office_current ?? 0
    let id_planet = context.eventPayload.id_planet ?? 0
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet }, orderBy: { lvl: "asc" } })
    const builder = builder_list[cur]
    if (builder_list.length > 0) {
        //const sel = buildin[0]
        const lvl_new = builder.lvl+1
        const price_new = 2*(lvl_new**2)
        keyboard.callbackButton({ label: `🔧 ${price_new.toFixed(2)}💰`, payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet  }, color: 'secondary' }).row()
        .callbackButton({ label: '💥 Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy', office_current: cur, target: builder.id, id_planet: id_planet }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        event_logger +=`💬 Здание: ${builder.name}-${builder.id}\n📈 Уровень: ${builder.lvl}\n💰 Вложено: ${builder.cost.toFixed(2)}\n Прибыль: ${builder.income.toFixed(2)}\n👥 Рабочих: ${builder.worker}\n\n${builder_list.length > 1 ? `~~~~ ${1+cur} из ${builder_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не построили здания, как насчет что-то построить??`
    }
    //следующий офис
    if (builder_list.length > 1 && cur < builder_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'builder_control', office_current: cur+1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
    }
    //предыдущий офис
    if (builder_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'builder_control', office_current: cur-1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
    }
    
    if (builder_list.length > 5) {
        if ( cur < builder_list.length/2) {
            //последний офис
            keyboard.callbackButton({ label: '→🕯', payload: { command: 'builder_control', office_current: builder_list.length-1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
        } else {
            //первый офис
            keyboard.callbackButton({ label: '←🕯', payload: { command: 'builder_control', office_current: 0, target: builder.id, id_planet: id_planet }, color: 'secondary' })
        }
    }
    //новый офис
    keyboard.callbackButton({ label: '➕', payload: { command: 'builder_controller', command_sub: 'builder_add', id_planet: id_planet }, color: 'secondary' })
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'planet_control' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Builder_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'builder_add': Builder_Add,
        /*'builder_upgrade': Builder_Upgrade, 
        'builder_config': Office_Config,
        'builder_destroy': Builder_Destroy,
        'builder_open': Office_Open*/
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Builder_Finder(need: string) {
    for (const build of buildin) {
        if (build.builder == need) {
            return build 
        }
    }
    return false
}
async function Builder_Add_Check(user: User, build: Builder_Set, id_planet: number): Promise<{message: string, gold: number, iron: number, status: boolean}> {
    let event_logger = { message: '', gold: 0, iron: 0, status: true}
    const planet_check = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (planet_check) {
        const builder_count = await prisma.builder.count({ where: { id_planet: planet_check.id } } )
        if (builder_count < planet_check.build) {
            event_logger.message = `✅ Свободно площадок на планете ${builder_count}/${planet_check.build}\n`
        } else {
            event_logger.message = `⛔ Занято площадок на планете ${builder_count}/${planet_check.build}\n`
            event_logger.status = false
            return event_logger
        }
    }
    for (const data of build.cost) {
        if (data.name == 'gold') {
            if (user.gold > data.count) {
                event_logger.message += `✅ Будет списан ресурс ${data.name} в количестве ${data.count}, на балансе останется: ${(user.gold - data.count).toFixed(2)}\n`
                event_logger.gold += data.count
                continue
            } else {
                event_logger.message += `⛔ Вам не хватает ${data.name} в размере ${(data.count - user.gold).toFixed(2)}\n`
                event_logger.status = false
                return event_logger
            }
        }
        if (data.name == 'iron') {
            if (user.iron > data.count) {
                event_logger.message += `✅ Будет списан ресурс ${data.name} в количестве ${data.count}, на балансе останется: ${(user.iron - data.count).toFixed(2)}\n`
                event_logger.iron += data.count
                continue
            } else {
                event_logger.message += `⛔ Вам не хватает ${data.name} в размере ${(data.count - user.iron).toFixed(2)}\n`
                event_logger.status = false
                return event_logger
            }
        }
    }
    event_logger.message
    return event_logger
}
async function Builder_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новое здание для стройки:\n\n`
    const cur = context.eventPayload.target_current || 0
    let id_planet = context.eventPayload.id_planet ?? 0
    if (context.eventPayload.selector) {
        const sel: Builder_Set | false = await Builder_Finder(context.eventPayload.selector)
        const build_calc: Builder_Init = {
            builder: `${context.eventPayload.selector}`,
            cost: [],
            input: [],
            output: [],
            require: [],
            description: 'zero'
        }
        if (sel) {
            for (let cost of sel.cost) {
                const lvl_new = 1 
                build_calc.cost.push({name: cost.name, count: cost.count*(lvl_new**cost.koef), koef: cost.koef})
            }
            if (sel.input) {
                for (let input of sel.input) {
                    const lvl_new = 1 
                    build_calc.input?.push({name: input.name, income: input.koef != 'none' ? input.income*(lvl_new**input.koef) : input.income, koef: input.koef, time: input.time})
                }
            }
            if (sel.output) {
                for (let output of sel.output) {
                    const lvl_new = 1 
                    build_calc.input?.push({name: output.name, income: output.outcome*(lvl_new**output.koef), koef: output.koef, time: output.time})
                }
            }
            if (sel.require) {
                for (let require of sel.require) {
                    const lvl_new = 1 
                    build_calc.require.push({name: require.name, limit: require.limit*(lvl_new**require.koef), koef: require.koef })
                }
            }
        }
        const build_checker = await Builder_Add_Check(user, build_calc, id_planet)
        if (build_checker.status) {
            await prisma.$transaction([
                prisma.builder.create({ data: { id_user: user.id, name: build_calc.builder, costing: JSON.stringify(build_calc.cost), input: JSON.stringify(build_calc.input) ?? '', output: JSON.stringify(build_calc.output) || '', require: JSON.stringify(build_calc.require), id_planet: id_planet } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: build_checker.gold }, iron: { decrement: build_checker.iron } } })
            ]).then(([builder_new, user_up]) => {
                event_logger = `⌛ Поздравляем с приобритением ${builder_new.name}-${builder_new.id}.\n Остаток: ${user_up.gold.toFixed(2)}💰 ${user_up.iron.toFixed(2)}📏` 
                console.log(`⌛ Поздравляем ${user.idvk} с приобритением ${builder_new.name}-${builder_new.id}.\n Остаток: ${user_up.gold.toFixed(2)}💰 ${user_up.iron.toFixed(2)}📏`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка приобретения нового здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `⌛ ${build_checker.message}`
        }
    } else {
        const limiter = 5
        let counter = 0
        for (let i=cur; i < buildin.length && counter < limiter; i++) {
            const builder = buildin[i]
            keyboard.callbackButton({ label: `➕ ${builder.builder}`, payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, target: target, selector: builder.builder, id_planet: id_planet }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder.builder}\n ${builder.description}\n`;
            event_logger += (await Builder_Add_Check(user, builder, id_planet)).message
            counter++
        }
        event_logger += `\n\n${buildin.length > 1 ? `~~~~ ${cur + buildin.length > cur+limiter ? limiter : limiter-(buildin.length-cur)} из ${buildin.length} ~~~~` : ''}`
            //предыдущий офис
            if (buildin.length > limiter && cur > limiter-1) {
                keyboard.callbackButton({ label: '←', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, target_current: cur-limiter, target: target, id_planet: id_planet }, color: 'secondary' })
            }
            //следующий офис
            if (buildin.length > limiter && cur < buildin.length-1) {
                keyboard.callbackButton({ label: '→', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, target_current: cur+limiter, target: target, id_planet: id_planet }, color: 'secondary' })
            }
            keyboard.callbackButton({ label: `❌ Фриланс`, payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, target_current: cur, target: target, selector: 'zero' }, color: 'secondary' })
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, target: target, id_planet: id_planet }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}
/*
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
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ //})
//}
/*
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
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ //})
//}
