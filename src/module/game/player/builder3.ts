import { Builder, Research, User } from "@prisma/client"
import prisma from "../../../module/prisma"
import { Context, KeyboardBuilder } from "vk-io"
import { Printer_Builder_Config, builder_config, builder_config_list } from "../datacenter/builder_config"
import { vk } from "../../../index"
import { icotransl_list } from "../datacenter/resources_translator"
import { Time_Controller } from "./service3"

export async function Builder_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let event_logger = `❄ Отдел управления сооружениями на планете ${id_planet}:\n\n`
    const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet }, orderBy: { name: "asc" } })
    const builder = builder_list[id_builder_sent]
    const services_ans = await Time_Controller(context, user, id_planet)
    if (builder_list.length > 0) {
        //const sel = buildin[0]
        keyboard.callbackButton({ label: `🔧 Улучшить`, payload: { command: 'builder_controller', command_sub: 'builder_upgrade', id_builder_sent: id_builder_sent, target: builder.id, id_planet: id_planet  }, color: 'secondary' }).row()
        keyboard.callbackButton({ label: '💥 Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy', id_builder_sent: id_builder_sent, target: builder.id, id_planet: id_planet }, color: 'secondary' })
        keyboard.callbackButton({ label: `♻`, payload: { command: 'builder_control', id_builder_sent: id_builder_sent, target: builder.id, id_planet: id_planet }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        event_logger += await Printer_Builder_Config(builder.name, builder.lvl, user, builder.id)
        /*
        const services_ans = await Builder_Lifer(user, builder, id_planet)*/
        const plancant = await prisma.planet.findFirst({ where: { id: id_planet }, select: { build: true } })
        event_logger += `\n${services_ans}`
        event_logger +=`\n\n${builder_list.length > 1 ? `~~~~ ${1+id_builder_sent} из ${builder_list.length} (макс ${plancant?.build}) ~~~~` : ''}`;
        
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

async function Builder_Checker_Build(user: User, id_planet: number, name_sel: string) {
    let event_logger = { message: '', status: true }
    const planet = await prisma.planet.findFirst({ where: { id: id_planet, id_user: user.id } })
    if (!planet) return
    const builder_sel = builder_config[name_sel]
    const builder_counter = await prisma.builder.count({ where: { id_user: user.id, id_planet: planet.id, name: builder_sel.name } })
    const builder_counter_all = await prisma.builder.count({ where: { id_user: user.id, id_planet: planet.id } })
    if (builder_counter_all < planet.build) {
        event_logger.message += ` ✅${builder_counter}/${builder_counter_all}/${planet.build}${icotransl_list['builder_block'].smile} `
    } else {
        event_logger.message += ` ⛔${builder_counter}/${builder_counter_all}/${planet.build}${icotransl_list['builder_block'].smile} `
    }
    if (user.gold >= builder_sel.cost.gold.price) {
        event_logger.message += ` ✅${builder_sel.cost.gold.price.toFixed(2)}${icotransl_list[builder_sel.cost.gold.name].smile} `
    } else {
        event_logger.message += ` ⛔${(builder_sel.cost.gold.price - user.gold).toFixed(2)}${icotransl_list[builder_sel.cost.gold.name].smile} `
        event_logger.status = false
    }
 
    if (user.iron >= builder_sel.cost.metal.price) {
        event_logger.message += ` ✅${builder_sel.cost.metal.price.toFixed(2)}${icotransl_list[builder_sel.cost.metal.name].smile} `
    } else {
        event_logger.message += ` ⛔${(builder_sel.cost.metal.price - user.iron).toFixed(2)}${icotransl_list[builder_sel.cost.metal.name].smile} `
        event_logger.status = false
    }
    return event_logger
}
async function Builder_Add(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новое здание для стройки:\n\n`
    const cur = context.eventPayload.target_current || 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    if (context.eventPayload.selector) {
        const sel = builder_config[context.eventPayload.selector]
        if (sel) {
            const build_checker = await Builder_Checker_Build(user, id_planet, sel.name)
            if (build_checker!.status) {
                await prisma.$transaction([
                    prisma.builder.create({ data: { id_user: user.id, name: sel.name, id_planet: id_planet, storage: JSON.stringify(sel.storage) } }),
                    prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: sel.cost.gold.price }, iron: { decrement: sel.cost.metal.price } } })
                ]).then(([builder_new, user_up]) => {
                    event_logger = `⌛ Поздравляем с приобритением ${builder_new.name}-${builder_new.id}.\n Остаток: ${user_up.gold.toFixed(2)}💰 ${user_up.iron.toFixed(2)}📏` 
                    console.log(`⌛ Поздравляем ${user.idvk} с приобритением ${builder_new.name}-${builder_new.id}.\n Остаток: ${user_up.gold.toFixed(2)}💰 ${user_up.iron.toFixed(2)}📏`);
                })
                .catch((error) => {
                    event_logger = `⌛ Произошла ошибка приобретения нового здания, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                event_logger = `⌛ ${build_checker!.message}`
            }
        }
    } else {
        const limiter = 5
        let counter = 0
        for (let i=cur; i < builder_config_list.length && counter < limiter; i++) {
            const builder = builder_config[builder_config_list[i]]
            keyboard.callbackButton({ label: `➕ ${builder.name}`, payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target: target, selector: builder.name, id_planet: id_planet }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder.name}\n ${builder.description}\n`;
            event_logger += (await Builder_Checker_Build(user, id_planet, builder.name))!.message
            counter++
        }
        event_logger += `\n\n${builder_config_list.length > 1 ? `~~~~ ${builder_config_list.length > limiter ? cur+limiter : limiter-(builder_config_list.length-cur)} из ${builder_config_list.length} ~~~~` : ''}`
        //предыдущий офис
        if (builder_config_list.length > limiter && cur > limiter-1) {
            keyboard.callbackButton({ label: '←', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target_current: cur-limiter, target: target, id_planet: id_planet }, color: 'secondary' })
        }
        //следующий офис
        if (builder_config_list.length > limiter && cur < builder_config_list.length-1) {
            keyboard.callbackButton({ label: '→', payload: { command: 'builder_controller', command_sub: 'builder_add', office_current: 0, id_builder_sent: id_builder_sent, target_current: cur+limiter, target: target, id_planet: id_planet }, color: 'secondary' })
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control', office_current: 0, id_builder_sent: id_builder_sent, target: target, id_planet: id_planet }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Checker_Upgrade(user: User, id_builder: number, lvl_need: number ) {
    const builder_checker = await prisma.builder.findFirst({ where: { id: id_builder, id_user: user.id } })
    if (!builder_checker) { return }
    const builder_configs = builder_config
    let event_logger = ''
    const lvl = builder_checker.lvl
    const i = builder_checker.name
    const research: Research | null | { lvl: number } = await prisma.research.findFirst({ where: { id_user: user.id, name: builder_checker.name } }) ?? { lvl: 10 }
    const lvl_need_will = lvl_need+lvl <= (research?.lvl ?? 10) ? lvl_need+lvl : research?.lvl ?? 10
    event_logger += `\n\n🏛 Здание: ${builder_configs[i].name}-${id_builder ? id_builder : ''}\n📝 Уровень: ${lvl}/${research?.lvl || 10} --> ${lvl_need_will}`
    event_logger += `\n💬 Описание: ${builder_configs[i].description}`
    if (builder_configs[i].input) {
        event_logger += `\n\n📈 Прибыль: `
        event_logger += `${builder_configs[i].input?.gold != undefined ? `\n${icotransl_list[builder_configs[i].input!.gold.name].smile} ${icotransl_list[builder_configs[i].input!.gold.name].name}: ${(builder_configs[i].input!.gold.income*((lvl)**builder_configs[i].input!.gold.koef)).toFixed(2)} --> ${(builder_configs[i].input!.gold.income*((lvl_need_will)**builder_configs[i].input!.gold.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.energy != undefined ? `\n${icotransl_list[builder_configs[i].input!.energy.name].smile} ${icotransl_list[builder_configs[i].input!.energy.name].name}: ${(builder_configs[i].input!.energy.income*((lvl)**builder_configs[i].input!.energy.koef)).toFixed(2)} --> ${(builder_configs[i].input!.energy.income*((lvl_need_will)**builder_configs[i].input!.energy.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.metal != undefined ? `\n${icotransl_list[builder_configs[i].input!.metal.name].smile} ${icotransl_list[builder_configs[i].input!.metal.name].name}: ${(builder_configs[i].input!.metal.income*((lvl)**builder_configs[i].input!.metal.koef)).toFixed(2)} --> ${(builder_configs[i].input!.metal.income*((lvl_need_will)**builder_configs[i].input!.metal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].input!.crystal.name].smile} ${icotransl_list[builder_configs[i].input!.crystal.name].name}: ${(builder_configs[i].input!.crystal.income*((lvl)**builder_configs[i].input!.crystal.koef)).toFixed(2)} --> ${(builder_configs[i].input!.crystal.income*((lvl_need_will)**builder_configs[i].input!.crystal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].input!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].input!.crystal_dirt.name].name}: ${(builder_configs[i].input!.crystal_dirt.income*((lvl)**builder_configs[i].input!.crystal_dirt.koef)).toFixed(2)} --> ${(builder_configs[i].input!.crystal_dirt.income*((lvl_need_will)**builder_configs[i].input!.crystal_dirt.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].input!.artefact.name].smile} ${icotransl_list[builder_configs[i].input!.artefact.name].name}: ${(builder_configs[i].input!.artefact.income*((lvl)**builder_configs[i].input!.artefact.koef)).toFixed(2)} --> ${(builder_configs[i].input!.artefact.income*((lvl_need_will)**builder_configs[i].input!.artefact.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.golden != undefined ? `\n${icotransl_list[builder_configs[i].input!.golden.name].smile} ${icotransl_list[builder_configs[i].input!.golden.name].name}: ${(builder_configs[i].input!.golden.income*((lvl)**builder_configs[i].input!.golden.koef)).toFixed(2)} --> ${(builder_configs[i].input!.golden.income*((lvl_need_will)**builder_configs[i].input!.golden.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.iron != undefined ? `\n${icotransl_list[builder_configs[i].input!.iron.name].smile} ${icotransl_list[builder_configs[i].input!.iron.name].name}: ${(builder_configs[i].input!.iron.income*((lvl)**builder_configs[i].input!.iron.koef)).toFixed(2)} --> ${(builder_configs[i].input!.iron.income*((lvl_need_will)**builder_configs[i].input!.iron.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].input!.uranium.name].smile} ${icotransl_list[builder_configs[i].input!.uranium.name].name}: ${(builder_configs[i].input!.uranium.income*((lvl)**builder_configs[i].input!.uranium.koef)).toFixed(2)} --> ${(builder_configs[i].input!.uranium.income*((lvl_need_will)**builder_configs[i].input!.uranium.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.oil != undefined ? `\n${icotransl_list[builder_configs[i].input!.oil.name].smile} ${icotransl_list[builder_configs[i].input!.oil.name].name}: ${(builder_configs[i].input!.oil.income*((lvl)**builder_configs[i].input!.oil.koef)).toFixed(2)} --> ${(builder_configs[i].input!.oil.income*((lvl_need_will)**builder_configs[i].input!.oil.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.gas != undefined ? `\n${icotransl_list[builder_configs[i].input!.gas.name].smile} ${icotransl_list[builder_configs[i].input!.gas.name].name}: ${(builder_configs[i].input!.gas.income*((lvl)**builder_configs[i].input!.gas.koef)).toFixed(2)} --> ${(builder_configs[i].input!.gas.income*((lvl_need_will)**builder_configs[i].input!.gas.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.coal != undefined ? `\n${icotransl_list[builder_configs[i].input!.coal.name].smile} ${icotransl_list[builder_configs[i].input!.coal.name].name}: ${(builder_configs[i].input!.coal.income*((lvl)**builder_configs[i].input!.coal.koef)).toFixed(2)} --> ${(builder_configs[i].input!.coal.income*((lvl_need_will)**builder_configs[i].input!.coal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].input!.builder_block.name].smile} ${icotransl_list[builder_configs[i].input!.builder_block.name].name}: ${(builder_configs[i].input!.builder_block.income*((lvl)**builder_configs[i].input!.builder_block.koef)).toFixed(2)} --> ${(builder_configs[i].input!.builder_block.income*((lvl_need_will)**builder_configs[i].input!.builder_block.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].input?.research != undefined ? `\n${icotransl_list[builder_configs[i].input!.research.name].smile} ${icotransl_list[builder_configs[i].input!.research.name].name}: ${(builder_configs[i].input!.research.income*((lvl)**builder_configs[i].input!.research.koef)).toFixed(2)} --> ${(builder_configs[i].input!.research.income*((lvl_need_will)**builder_configs[i].input!.research.koef)).toFixed(2)}` : ""}`
    }
    if (builder_configs[i].storage) {
        if (id_builder) {
            const buildstore = await prisma.builder.findFirst({ where: { id: id_builder } })
            if (buildstore && buildstore.storage) { builder_configs[i].storage = JSON.parse(buildstore.storage) }
        }
        event_logger += `\n\n📦 Хранилище: `
        event_logger += `${builder_configs[i].storage?.gold != undefined ? `\n${icotransl_list[builder_configs[i].storage!.gold.name].smile} ${icotransl_list[builder_configs[i].storage!.gold.name].name}: ${builder_configs[i].storage!.gold.count.toFixed(2)}/${(builder_configs[i].storage!.gold.limit*((lvl)**builder_configs[i].storage!.gold.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.gold.count.toFixed(2)}/${(builder_configs[i].storage!.gold.limit*((lvl_need_will)**builder_configs[i].storage!.gold.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.energy != undefined ? `\n${icotransl_list[builder_configs[i].storage!.energy.name].smile} ${icotransl_list[builder_configs[i].storage!.energy.name].name}: ${builder_configs[i].storage!.energy.count.toFixed(2)}/${(builder_configs[i].storage!.energy.limit*((lvl)**builder_configs[i].storage!.energy.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.energy.count.toFixed(2)}/${(builder_configs[i].storage!.energy.limit*((lvl_need_will)**builder_configs[i].storage!.energy.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.metal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.metal.name].smile} ${icotransl_list[builder_configs[i].storage!.metal.name].name}: ${builder_configs[i].storage!.metal.count.toFixed(2)}/${(builder_configs[i].storage!.metal.limit*((lvl)**builder_configs[i].storage!.metal.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.metal.count.toFixed(2)}/${(builder_configs[i].storage!.metal.limit*((lvl_need_will)**builder_configs[i].storage!.metal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.crystal.name].smile} ${icotransl_list[builder_configs[i].storage!.crystal.name].name}: ${builder_configs[i].storage!.crystal.count.toFixed(2)}/${(builder_configs[i].storage!.crystal.limit*((lvl)**builder_configs[i].storage!.crystal.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.crystal.count.toFixed(2)}/${(builder_configs[i].storage!.crystal.limit*((lvl_need_will)**builder_configs[i].storage!.crystal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].storage!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].storage!.crystal_dirt.name].name}: ${builder_configs[i].storage!.crystal_dirt.count.toFixed(2)}/${(builder_configs[i].storage!.crystal_dirt.limit*((lvl)**builder_configs[i].storage!.crystal_dirt.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.crystal_dirt.count.toFixed(2)}/${(builder_configs[i].storage!.crystal_dirt.limit*((lvl_need_will)**builder_configs[i].storage!.crystal_dirt.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].storage!.artefact.name].smile} ${icotransl_list[builder_configs[i].storage!.artefact.name].name}: ${builder_configs[i].storage!.artefact.count.toFixed(2)}/${(builder_configs[i].storage!.artefact.limit*((lvl)**builder_configs[i].storage!.artefact.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.artefact.count.toFixed(2)}/${(builder_configs[i].storage!.artefact.limit*((lvl_need_will)**builder_configs[i].storage!.artefact.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.golden != undefined ? `\n${icotransl_list[builder_configs[i].storage!.golden.name].smile} ${icotransl_list[builder_configs[i].storage!.golden.name].name}: ${builder_configs[i].storage!.golden.count.toFixed(2)}/${(builder_configs[i].storage!.golden.limit*((lvl)**builder_configs[i].storage!.golden.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.golden.count.toFixed(2)}/${(builder_configs[i].storage!.golden.limit*((lvl_need_will)**builder_configs[i].storage!.golden.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.iron != undefined ? `\n${icotransl_list[builder_configs[i].storage!.iron.name].smile} ${icotransl_list[builder_configs[i].storage!.iron.name].name}: ${builder_configs[i].storage!.iron.count.toFixed(2)}/${(builder_configs[i].storage!.iron.limit*((lvl)**builder_configs[i].storage!.iron.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.iron.count.toFixed(2)}/${(builder_configs[i].storage!.iron.limit*((lvl_need_will)**builder_configs[i].storage!.iron.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].storage!.uranium.name].smile} ${icotransl_list[builder_configs[i].storage!.uranium.name].name}: ${builder_configs[i].storage!.uranium.count.toFixed(2)}/${(builder_configs[i].storage!.uranium.limit*((lvl)**builder_configs[i].storage!.uranium.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.uranium.count.toFixed(2)}/${(builder_configs[i].storage!.uranium.limit*((lvl_need_will)**builder_configs[i].storage!.uranium.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.oil != undefined ? `\n${icotransl_list[builder_configs[i].storage!.oil.name].smile} ${icotransl_list[builder_configs[i].storage!.oil.name].name}: ${builder_configs[i].storage!.oil.count.toFixed(2)}/${(builder_configs[i].storage!.oil.limit*((lvl)**builder_configs[i].storage!.oil.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.oil.count.toFixed(2)}/${(builder_configs[i].storage!.oil.limit*((lvl_need_will)**builder_configs[i].storage!.oil.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.gas != undefined ? `\n${icotransl_list[builder_configs[i].storage!.gas.name].smile} ${icotransl_list[builder_configs[i].storage!.gas.name].name}: ${builder_configs[i].storage!.gas.count.toFixed(2)}/${(builder_configs[i].storage!.gas.limit*((lvl)**builder_configs[i].storage!.gas.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.gas.count.toFixed(2)}/${(builder_configs[i].storage!.gas.limit*((lvl_need_will)**builder_configs[i].storage!.gas.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.coal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.coal.name].smile} ${icotransl_list[builder_configs[i].storage!.coal.name].name}: ${builder_configs[i].storage!.coal.count.toFixed(2)}/${(builder_configs[i].storage!.coal.limit*((lvl)**builder_configs[i].storage!.coal.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.coal.count.toFixed(2)}/${(builder_configs[i].storage!.coal.limit*((lvl_need_will)**builder_configs[i].storage!.coal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].storage!.builder_block.name].smile} ${icotransl_list[builder_configs[i].storage!.builder_block.name].name}: ${builder_configs[i].storage!.builder_block.count.toFixed(2)}/${(builder_configs[i].storage!.builder_block.limit*((lvl)**builder_configs[i].storage!.builder_block.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.builder_block.count.toFixed(2)}/${(builder_configs[i].storage!.builder_block.limit*((lvl_need_will)**builder_configs[i].storage!.builder_block.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.worker != undefined ? `\n${icotransl_list[builder_configs[i].storage!.worker.name].smile} ${icotransl_list[builder_configs[i].storage!.worker.name].name}: ${builder_configs[i].storage!.worker.count.toFixed(0)}/${(builder_configs[i].storage!.worker.limit*((lvl)**builder_configs[i].storage!.worker.koef_limit)).toFixed(0)} --> ${builder_configs[i].storage!.worker.count.toFixed(0)}/${(builder_configs[i].storage!.worker.limit*((lvl_need_will)**builder_configs[i].storage!.worker.koef_limit)).toFixed(0)}` : ""}`
    }
    if (builder_configs[i].output) {
        event_logger += `\n\n📉 Потребление: `
        event_logger += `${builder_configs[i].output?.gold != undefined ? `\n${icotransl_list[builder_configs[i].output!.gold.name].smile} ${icotransl_list[builder_configs[i].output!.gold.name].name}: ${(builder_configs[i].output!.gold.outcome*((lvl)**builder_configs[i].output!.gold.koef)).toFixed(2)} --> ${(builder_configs[i].output!.gold.outcome*((lvl_need_will)**builder_configs[i].output!.gold.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.energy != undefined ? `\n${icotransl_list[builder_configs[i].output!.energy.name].smile} ${icotransl_list[builder_configs[i].output!.energy.name].name}: ${(builder_configs[i].output!.energy.outcome*((lvl)**builder_configs[i].output!.energy.koef)).toFixed(2)} --> ${(builder_configs[i].output!.energy.outcome*((lvl_need_will)**builder_configs[i].output!.energy.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.metal != undefined ? `\n${icotransl_list[builder_configs[i].output!.metal.name].smile} ${icotransl_list[builder_configs[i].output!.metal.name].name}: ${(builder_configs[i].output!.metal.outcome*((lvl)**builder_configs[i].output!.metal.koef)).toFixed(2)} --> ${(builder_configs[i].output!.metal.outcome*((lvl_need_will)**builder_configs[i].output!.metal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].output!.crystal.name].smile} ${icotransl_list[builder_configs[i].output!.crystal.name].name}: ${(builder_configs[i].output!.crystal.outcome*((lvl)**builder_configs[i].output!.crystal.koef)).toFixed(2)} --> ${(builder_configs[i].output!.crystal.outcome*((lvl_need_will)**builder_configs[i].output!.crystal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].output!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].output!.crystal_dirt.name].name}: ${(builder_configs[i].output!.crystal_dirt.outcome*((lvl)**builder_configs[i].output!.crystal_dirt.koef)).toFixed(2)} --> ${(builder_configs[i].output!.crystal_dirt.outcome*((lvl_need_will)**builder_configs[i].output!.crystal_dirt.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].output!.artefact.name].smile} ${icotransl_list[builder_configs[i].output!.artefact.name].name}: ${(builder_configs[i].output!.artefact.outcome*((lvl)**builder_configs[i].output!.artefact.koef)).toFixed(2)} --> ${(builder_configs[i].output!.artefact.outcome*((lvl_need_will)**builder_configs[i].output!.artefact.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.golden != undefined ? `\n${icotransl_list[builder_configs[i].output!.golden.name].smile} ${icotransl_list[builder_configs[i].output!.golden.name].name}: ${(builder_configs[i].output!.golden.outcome*((lvl)**builder_configs[i].output!.golden.koef)).toFixed(2)} --> ${(builder_configs[i].output!.golden.outcome*((lvl_need_will)**builder_configs[i].output!.golden.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.iron != undefined ? `\n${icotransl_list[builder_configs[i].output!.iron.name].smile} ${icotransl_list[builder_configs[i].output!.iron.name].name}: ${(builder_configs[i].output!.iron.outcome*((lvl)**builder_configs[i].output!.iron.koef)).toFixed(2)} --> ${(builder_configs[i].output!.iron.outcome*((lvl_need_will)**builder_configs[i].output!.iron.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].output!.uranium.name].smile} ${icotransl_list[builder_configs[i].output!.uranium.name].name}: ${(builder_configs[i].output!.uranium.outcome*((lvl)**builder_configs[i].output!.uranium.koef)).toFixed(2)} --> ${(builder_configs[i].output!.uranium.outcome*((lvl_need_will)**builder_configs[i].output!.uranium.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.oil != undefined ? `\n${icotransl_list[builder_configs[i].output!.oil.name].smile} ${icotransl_list[builder_configs[i].output!.oil.name].name}: ${(builder_configs[i].output!.oil.outcome*((lvl)**builder_configs[i].output!.oil.koef)).toFixed(2)} --> ${(builder_configs[i].output!.oil.outcome*((lvl_need_will)**builder_configs[i].output!.oil.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.gas != undefined ? `\n${icotransl_list[builder_configs[i].output!.gas.name].smile} ${icotransl_list[builder_configs[i].output!.gas.name].name}: ${(builder_configs[i].output!.gas.outcome*((lvl)**builder_configs[i].output!.gas.koef)).toFixed(2)} --> ${(builder_configs[i].output!.gas.outcome*((lvl_need_will)**builder_configs[i].output!.gas.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.coal != undefined ? `\n${icotransl_list[builder_configs[i].output!.coal.name].smile} ${icotransl_list[builder_configs[i].output!.coal.name].name}: ${(builder_configs[i].output!.coal.outcome*((lvl)**builder_configs[i].output!.coal.koef)).toFixed(2)} --> ${(builder_configs[i].output!.coal.outcome*((lvl_need_will)**builder_configs[i].output!.coal.koef)).toFixed(2)}` : ""}`
        event_logger += `${builder_configs[i].output?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].output!.builder_block.name].smile} ${icotransl_list[builder_configs[i].output!.builder_block.name].name}: ${(builder_configs[i].output!.builder_block.outcome*((lvl)**builder_configs[i].output!.builder_block.koef)).toFixed(2)} --> ${(builder_configs[i].output!.builder_block.outcome*((lvl_need_will)**builder_configs[i].output!.builder_block.koef)).toFixed(2)}` : ""}`
    }
    if (builder_configs[i].require) {
        event_logger += `\n\n⚙ Требование: `
        event_logger += `${builder_configs[i].require?.worker != undefined ? `\n${icotransl_list[builder_configs[i].require!.worker.name].smile} ${icotransl_list[builder_configs[i].require!.worker.name].name}: ${(builder_configs[i].require!.worker.limit*((lvl)**builder_configs[i].require!.worker.koef)).toFixed(0)} --> ${(builder_configs[i].require!.worker.limit*((lvl_need_will)**builder_configs[i].require!.worker.koef)).toFixed(0)}` : ""}`
    }
    let gold = 0
    let metal = 0
    let status = true
    if (builder_checker.lvl < lvl_need_will) {
        for (let j = builder_checker.lvl; j < lvl_need_will; j++) {
            gold += builder_configs[i].cost.gold.price*(j)**builder_configs[i].cost.gold.koef
            metal += builder_configs[i].cost.metal.price*(j)**builder_configs[i].cost.metal.koef
        }
        event_logger += `\n\n📐 Стоимость при улучшении:`
        if (user.gold < gold || user.iron < metal) {
            status = false
        }
        event_logger += ` ${user.gold >= gold ? `✅${gold.toFixed(2)}` : `⛔${(gold - user.gold).toFixed(2)}` }${icotransl_list['gold'].smile} `
        event_logger += ` ${user.iron >= metal ? `✅${metal.toFixed(2)}` : `⛔${(metal - user.iron).toFixed(2)}` }${icotransl_list['metal'].smile} `
    } else {
        status = false
        event_logger += `\n⛔ Достигнут максимальный уровень ${research!.lvl}`
    }
    return { message: event_logger, gold: gold, metal: metal, status: status, lvl: lvl_need_will }
}

async function Builder_Upgrade(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент здание нельзя улучшить...`
    let cur = context.eventPayload.office_current ?? 0
    let id_planet = context.eventPayload.id_planet ?? 0
    let id_builder_sent = context.eventPayload.id_builder_sent ?? 0
    const limapro = context.eventPayload.limapro ?? 1
    if (builder) {
        const sel = builder_config[builder.name]
        if (!sel) { return }
        const build_checker = await Builder_Checker_Upgrade(user, builder.id, limapro)
        if (context.eventPayload.status == "ok") {
            if (build_checker!.status) {
                await prisma.$transaction([
                    prisma.builder.update({ where: { id: builder.id }, data: { lvl: build_checker?.lvl, } }),
                    prisma.user.update({ where: { id: user.id }, data: { gold: { decrement: build_checker!.gold }, iron: { decrement: build_checker!.metal } } })
                ]).then(([builder_up, user_up]) => {
                    event_logger = `⌛ Поздравляем с улучшением уровня здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n💰 Шекеля: ${user.gold.toFixed(2)} - ${build_checker!.gold.toFixed(2)} = ${user_up.gold.toFixed(2)}\n${icotransl_list['iron'].smile} Железо: ${user.iron.toFixed(2)} - ${build_checker!.metal.toFixed(2)} = ${user_up.iron.toFixed(2)}` 
                    console.log(`⌛ Поздравляем ${user.idvk} с улучшением уровня здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n💰 Шекеля: ${user.gold.toFixed(2)} - ${build_checker!.gold.toFixed(2)} = ${user_up.gold.toFixed(2)}\n${icotransl_list['iron'].smile} Железо: ${user.iron.toFixed(2)} - ${build_checker!.metal.toFixed(2)} = ${user_up.iron.toFixed(2)}`);
                    //keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
                })
                .catch((error) => {
                    event_logger = `⌛ Произошла ошибка прокачки здания, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                event_logger += `\n${build_checker!.message}\n.`
            }
        } else {
            event_logger = `Вы уверены, что хотите улучшить здание ${builder.name}-${builder.id}?\n\n${build_checker?.message}`
            keyboard.callbackButton({ label: 'ОК', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, status: "ok", id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: limapro }, color: 'secondary' })
            keyboard.callbackButton({ label: 'Хочу x2', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 2 }, color: 'secondary' }).row()
            keyboard.callbackButton({ label: 'Хочу x5', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 5 }, color: 'secondary' })
            keyboard.callbackButton({ label: 'Хочу x10', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 10 }, color: 'secondary' }).row()
            keyboard.callbackButton({ label: 'Хочу x25', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 25 }, color: 'secondary' })
            keyboard.callbackButton({ label: 'Хочу x50', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 50 }, color: 'secondary' }).row()
            keyboard.callbackButton({ label: 'Хочу x75', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 75 }, color: 'secondary' })
            keyboard.callbackButton({ label: 'Хочу x100', payload: { command: 'builder_controller', command_sub: 'builder_upgrade', office_current: cur, target: builder.id, id_planet: id_planet, id_builder_sent: id_builder_sent, limapro: 100 }, color: 'secondary' }).row()
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
            const builder_ans = await Builder_Checker_Upgrade(user, builder.id, builder.lvl)
            await prisma.$transaction([
                prisma.builder.delete({ where: { id: builder.id } }),
                prisma.user.update({ where: { id: user.id }, data: { gold: { increment: builder_ans?.gold } } })
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