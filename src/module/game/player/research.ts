import { User, Builder } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { Builder_Init, Builder_Set, Cost, Cost_Set, Input, Output, Require, buildin } from "../datacenter/builder_config";
import { icotransl_list } from "../datacenter/resources_translator";
import { Builder_Lifer } from "./service";

export async function Research_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите технологию для исследования:\n\n`
    const cur = context.eventPayload.target_current || 0
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
            keyboard.callbackButton({ label: `➕ ${builder.builder}`, payload: { command: 'research_controller', command_sub: 'research_upgrade', selector: builder.builder }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder.builder}\n ${builder.description}\n`;
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