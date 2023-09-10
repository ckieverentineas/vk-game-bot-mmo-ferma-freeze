import { User, Builder } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { Builder_Init, Builder_Set, Cost, Cost_Set, Input, Output, Require, buildin } from "../datacenter/builder_config";
import { icotransl_list } from "../datacenter/resources_translator";


export async function Builder_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let event_logger = `❄ Отдел управления сооружениями на планете ${id_planet}:\n\n`
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet }, orderBy: { lvl: "asc" } })
    const builder = builder_list[id_builder_sent]
    if (builder_list.length > 0) {
        //const sel = buildin[0]
        if (builder.upgradeble) {
            keyboard.callbackButton({ label: `🔧 Улучшить`, payload: { command: 'builder_controller', command_sub: 'builder_upgrade', id_builder_sent: id_builder_sent, target: builder.id, id_planet: id_planet  }, color: 'secondary' }).row()
        }
        keyboard.callbackButton({ label: '💥 Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy', id_builder_sent: id_builder_sent, target: builder.id, id_planet: id_planet }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        const costs: Cost[] = JSON.parse(builder.costing)
        event_logger +=`💬 Здание: ${builder.name}-${builder.id}\n📝 Уровень: ${builder.lvl}\n`
        event_logger += `\n📊 Вложено: \n`
        for (const cost of costs) {
            event_logger += `${icotransl_list[cost.name].smile} ${icotransl_list[cost.name].name} --> ${cost.count.toFixed(2)}\n`
        }
        const inputs: Input[] = JSON.parse(builder.input)
        event_logger += `\n📈 Прибыль: \n`
        for (const input of inputs) {
            event_logger += `${icotransl_list[input.name].smile} ${icotransl_list[input.name].name} --> ${input.income.toFixed(2)}  ${input.time != 'none' ? `в ${input.time/3600000} часа(ов)` : ''}\n`
        }
        const outputs: Output[] = JSON.parse(builder.output)
        event_logger += `\n📉 Потребление: \n`
        for (const output of outputs) {
            event_logger += `${icotransl_list[output.name].smile} ${icotransl_list[output.name].name} --> ${output.outcome.toFixed(2)} в ${output.time/3600000} час(ов)\n`
        }
        const requires: Require[] = JSON.parse(builder.require)
        event_logger += `\n⚙ Требования: \n`
        for (const require of requires) {
            event_logger += `${icotransl_list[require.name].smile} ${icotransl_list[require.name].name} --> ${require.limit.toFixed(0)}\n`
        }
        const build_calc = await Builder_Calculation(builder.name, builder.lvl)
        if (builder.upgradeble) {
            event_logger += `\n📐 При улучшении: \n`
            event_logger += (await Builder_Add_Check(user, build_calc, id_planet, false)).message
        }
        event_logger +=`\n\n${builder_list.length > 1 ? `~~~~ ${1+id_builder_sent} из ${builder_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не построили здания, как насчет что-то построить??`
    }
    
    //предыдущий офис
    if (builder_list.length > 1 && id_builder_sent > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'builder_control', id_builder_sent: id_builder_sent-1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
    }
    //следующий офис
    if (builder_list.length > 1 && id_builder_sent < builder_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'builder_control', id_builder_sent: id_builder_sent+1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
    }
    if (builder_list.length > 5) {
        if ( id_builder_sent < builder_list.length/2) {
            //последний офис
            keyboard.callbackButton({ label: '→🕯', payload: { command: 'builder_control', id_builder_sent: builder_list.length-1, target: builder.id, id_planet: id_planet }, color: 'secondary' })
        } else {
            //первый офис
            keyboard.callbackButton({ label: '←🕯', payload: { command: 'builder_control', id_builder_sent: 0, target: builder.id, id_planet: id_planet }, color: 'secondary' })
        }
    }
    //новый офис
    keyboard.callbackButton({ label: '➕', payload: { command: 'builder_controller', command_sub: 'builder_add', id_builder_sent: id_builder_sent, id_planet: id_planet }, color: 'secondary' })
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'planet_control' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Builder_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'builder_add': Builder_Add,
        'builder_destroy': Builder_Destroy,
        'builder_upgrade': Builder_Upgrade, 
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
async function Builder_Add_Check(user: User, build: Builder_Set, id_planet: number, fisrt_buildin: boolean): Promise<{message: string, gold: number, iron: number, status: boolean}> {
    let event_logger = { message: '', gold: 0, iron: 0, status: true}
    const planet_check = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (planet_check && fisrt_buildin) {
        const builder_count = await prisma.builder.count({ where: { id_planet: planet_check.id } } )
        if (builder_count < planet_check.build) {
            event_logger.message = ` ✅${builder_count}/${planet_check.build}⚒ `
        } else {
            event_logger.message = `\n⛔ Занято площадок на планете ${builder_count}/${planet_check.build}\n`
            event_logger.status = false;
            return event_logger
        }
    }
    for (const data of build.cost) {
        if (data.name == 'gold') {
            if (user.gold > data.count) {
                event_logger.message += ` ✅${data.count.toFixed(2)}${icotransl_list[data.name].smile} `
                event_logger.gold += data.count
                continue
            } else {
                event_logger.message += ` ⛔${(data.count - user.gold).toFixed(2)}${icotransl_list[data.name].smile} `
                event_logger.status = false
                //return event_logger
            }
        }
        if (data.name == 'iron') {
            if (user.iron > data.count) {
                event_logger.message += ` ✅${data.count.toFixed(2)}${icotransl_list[data.name].smile} `
                event_logger.iron += data.count
                continue
            } else {
                event_logger.message += ` ⛔${(data.count - user.iron).toFixed(2)}${icotransl_list[data.name].smile} `
                event_logger.status = false
                //return event_logger
            }
        }
    }
    event_logger.message
    return event_logger
}

async function Limiter_Lvl(builder: Builder) {
    const event_logger = { message: '', status: true}
    if (builder.lvl > 9) {
        event_logger.status = false
        event_logger.message = '⛔ Достигнут максимальный уровень'
    }
    return event_logger
}
async function Builder_Calculation(name_sel: string, lvl: number) {
    const sel: Builder_Set | false = await Builder_Finder(name_sel)
    const lvl_new = lvl+1 
    const buil: Builder_Init | false = await Builder_Finder(name_sel)
    const trig = buil ? buil.upgradeble : true
    const build_calc: Builder_Init = {
        builder: `${name_sel}`,
        cost: [],
        input: [],
        output: [],
        require: [],
        description: 'zero',
        upgradeble: trig
    }
    if (sel) {
        for (let cost of sel.cost) {
            build_calc.cost.push({name: cost.name, count: cost.count*(lvl_new**cost.koef), koef: cost.koef})
        }
        if (sel.input) {
            for (let input of sel.input) {
                build_calc.input?.push({name: input.name, income: input.koef != 'none' ? input.income*(lvl_new**input.koef) : input.income, koef: input.koef, time: input.time})
            }
        }
        if (sel.output) {
            for (let output of sel.output) {
                build_calc.output?.push({name: output.name, outcome: output.outcome*(lvl_new**output.koef), koef: output.koef, time: output.time})
            }
        }
        if (sel.require) {
            for (let require of sel.require) { 
                build_calc.require.push({name: require.name, limit: require.limit*(lvl_new**require.koef), koef: require.koef })
            }
        }
    }
    return build_calc
}
async function Builder_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новое здание для стройки:\n\n`
    const cur = context.eventPayload.target_current || 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    if (context.eventPayload.selector) {
        const sel: Builder_Set | false = await Builder_Finder(context.eventPayload.selector)
        if (sel) {
            const build_calc = await Builder_Calculation(sel.builder, 0)
            const build_checker = await Builder_Add_Check(user, build_calc, id_planet, true)
            if (build_checker.status) {
                await prisma.$transaction([
                    prisma.builder.create({ data: { id_user: user.id, name: build_calc.builder, costing: JSON.stringify(build_calc.cost), input: JSON.stringify(build_calc.input) ?? '', output: JSON.stringify(build_calc.output) || '', require: JSON.stringify(build_calc.require), id_planet: id_planet, upgradeble: build_calc.upgradeble } }),
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
        }
    } else {
        const limiter = 5
        let counter = 0
        for (let i=cur; i < buildin.length && counter < limiter; i++) {
            const builder = buildin[i]
            keyboard.callbackButton({ label: `➕ ${builder.builder}`, payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target: target, selector: builder.builder, id_planet: id_planet }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder.builder}\n ${builder.description}\n`;
            event_logger += (await Builder_Add_Check(user, builder, id_planet, true)).message
            counter++
        }
        event_logger += `\n\n${buildin.length > 1 ? `~~~~ ${cur + buildin.length > cur+limiter ? limiter : limiter-(buildin.length-cur)} из ${buildin.length} ~~~~` : ''}`
            //предыдущий офис
            if (buildin.length > limiter && cur > limiter-1) {
                keyboard.callbackButton({ label: '←', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target_current: cur-limiter, target: target, id_planet: id_planet }, color: 'secondary' })
            }
            //следующий офис
            if (buildin.length > limiter && cur < buildin.length-1) {
                keyboard.callbackButton({ label: '→', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target_current: cur+limiter, target: target, id_planet: id_planet }, color: 'secondary' })
            }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, id_builder_sent: id_builder_sent, target: target, id_planet: id_planet }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Costing_Finder(costing: Cost_Set[], target: 'gold' | 'iron') {
    for (const find of costing) {
        if (find.name == target) {
            return find
        }
    }
    return false
}
async function Builder_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент здание нельзя улучшить...`
    let cur = context.eventPayload.office_current ?? 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    if (builder) {
        const sel = await Builder_Finder(builder.name)
        if (!sel) { return }
        const build_calc: Builder_Init = await Builder_Calculation(sel.builder, builder.lvl)
        if (!build_calc) { return }
        const build_checker = await Builder_Add_Check(user, build_calc, id_planet, false)
        const build_lvl_checker = await Limiter_Lvl(builder)
        if (context.eventPayload.status == "ok") {
            if (build_checker.status && build_lvl_checker.status) {
                const golden_cost = await Costing_Finder(JSON.parse(builder.costing), 'gold')
                if (!golden_cost) { return }
                const iron_cost = await Costing_Finder(JSON.parse(builder.costing), 'iron')
                if (!iron_cost) { return }
                const cost_upa: Cost_Set[] = [{ name: golden_cost.name, count: golden_cost.count+build_checker.gold }, { name: iron_cost.name, count: iron_cost.count+build_checker.iron }, ]
                await prisma.$transaction([
                    prisma.builder.update({ where: { id: builder.id }, data: { lvl: 1+builder.lvl, costing: JSON.stringify(cost_upa), input: JSON.stringify(build_calc.input) ?? '', output: JSON.stringify(build_calc.output) || '', require: JSON.stringify(build_calc.require), } }),
                    prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: build_checker.gold }, iron: { decrement: build_checker.iron } } })
                ]).then(([builder_up, user_up]) => {
                    event_logger = `⌛ Поздравляем с улучшением уровня здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n💰 Шекеля: ${user.gold.toFixed(2)} - ${build_checker.gold.toFixed(2)} = ${user_up.gold.toFixed(2)}\n${icotransl_list['iron'].smile} Железо: ${user.iron.toFixed(2)} - ${build_checker.iron.toFixed(2)} = ${user_up.iron.toFixed(2)}` 
                    console.log(`⌛ Поздравляем ${user.idvk} с улучшением уровня здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n💰 Шекеля: ${user.gold.toFixed(2)} - ${build_checker.gold.toFixed(2)} = ${user_up.gold.toFixed(2)}\n${icotransl_list['iron'].smile} Железо: ${user.iron.toFixed(2)} - ${build_checker.iron.toFixed(2)} = ${user_up.iron.toFixed(2)}`);
                    //keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
                })
                .catch((error) => {
                    event_logger = `⌛ Произошла ошибка прокачки здания, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                event_logger += `\n${build_checker.message}\n ${build_lvl_checker.message}.`
            }
        } else {
            event_logger = `Вы уверены, что хотите улучшить здание ${builder.name}-${builder.id} за -->\n💰 Шекеля: ${build_checker.gold.toFixed(2)} при балансе ${user.gold.toFixed(2)}\n${icotransl_list['iron'].smile} Железо: ${build_checker.iron.toFixed(2)} при балансе ${user.iron.toFixed(2)}?\n\n Параметры вырастут следующим образом:\n\n`
            if (build_calc.input) {
                const inputs_new: Input[] = build_calc.input
                const inputs: Input[] = JSON.parse(builder.input)
                event_logger += `\n📈 Прибыль: \n`
                for (const input_new of inputs_new) {
                    for (const input of inputs) {
                        if (input.name == input_new.name) {
                            event_logger += `${icotransl_list[input.name].smile} ${icotransl_list[input.name].name}: ${input.income.toFixed(2)} --> ${input_new.income.toFixed(2)}  ${input.time != 'none' ? `в ${input.time/3600000} часа(ов)` : ''}\n`
                        }
                    }
                }
            }
            if (build_calc.output) {
                const outputs_new: Output[] = build_calc.output
                const outputs: Output[] = JSON.parse(builder.output)
                event_logger += `\n📉 Потребление: \n`
                for (const output_new of outputs_new) {
                    for (const output of outputs) {
                        if (output.name == output_new.name) {
                            event_logger += `${icotransl_list[output.name].smile} ${icotransl_list[output.name].name}: ${output.outcome.toFixed(2)} --> ${output_new.outcome.toFixed(2)} в ${output.time/3600000} час(ов)\n`
                        }
                    }
                }
            }
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, status: "ok", id_planet: id_planet, id_builder_sent: id_builder_sent }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: cur, target: undefined, id_planet: id_planet, id_builder_sent: id_builder_sent }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент нельзя снести здания...`
    let id_planet = context.eventPayload.id_planet ?? 0
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    if (builder) {
        if (context.eventPayload.status == "ok") {
            const costs: Cost[] = JSON.parse(builder.costing)
            let gold_return = 0
            let iron_return = 0
            for (const cost of costs) {
                if (cost.name == 'gold') {
                    gold_return += cost.count
                }
                if (cost.name == 'iron') {
                    iron_return += cost.count
                }
            }
            await prisma.$transaction([
                prisma.builder.delete({ where: { id: builder.id } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { increment: gold_return/2 } } })
            ]).then(([builder_del, user_return]) => {
                event_logger = `⌛ Поздравляем с разрушением здания ${builder_del.name}-${builder_del.id}.\n💳 Вам возвращено 50%, теперь на балансе ${user_return.gold.toFixed(2)}💰` 
                console.log(`⌛ Поздравляем ${user.idvk} с разрушением здания ${builder_del.name}-${builder_del.id}.\n💳 Вам возвращено 50%, теперь на балансе ${user_return.gold.toFixed(2)}💰`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка разрушения здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `Вы уверены, что хотите снести ${builder.name}-${builder.id} вам вернется не более 50% стоимости шекелей?`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'builder_controller', command_sub: 'builder_destroy', id_builder_sent: id_builder_sent, office_current: 0, target: builder.id, status: "ok", id_planet: id_planet }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, id_builder_sent, target: undefined, id_planet: id_planet }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}
