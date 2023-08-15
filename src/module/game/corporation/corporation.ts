import { User, Builder, Corporation } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { Send_Message } from "../account/service";

const buildin: { [key: string]: { price: number, income: number, cost: number, koef_price: number, koef_income: number, type: string, smile: string, description: string } } = {
    "Офис": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'gold', smile: '💰', description: "Офис является штабом вашего бизнеса и фискирует прибыль в шекелях" },
    "Электростанция": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'energy', smile: '⚡', description: "Электростанция является источником энергии для вашего бизнеса в виде энергии" }
}

export async function Main_Menu_Corporation(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const corporation: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    let event_logger = `❄ Отделение корпорации:\n\n`
    if (corporation) {
        const member_counter: number = await prisma.user.count({ where: { id_corporation: user.id_corporation} })
        const leader = await prisma.user.findFirst({ where: { id: corporation.id_user } })
        event_logger +=`💬 Корпорация: ${corporation.name}-${corporation.id}\n🌐 Основатель: @id${leader?.idvk}(${leader?.name})\n📈 Уровень: ${corporation.lvl}\n📗 Опыт: ${corporation.xp.toFixed(2)}\n💰 Шекели: ${corporation.gold.toFixed(2)}\n⚡ Энергия: ${corporation.energy.toFixed(2)}\n🤝 Репутация: ${corporation.reputation.toFixed(2)}\n👥 Сотрудников: ${member_counter}/${corporation.member}\n`;
        keyboard.callbackButton({ label: '🏛 Постройки', payload: { command: 'builder_control_corporation', stat: "atk" }, color: 'secondary' })
        .callbackButton({ label: '👥 Сотрудники', payload: { command: 'member_control', stat: "health"  }, color: 'secondary' }).row()
    } else {
        keyboard//.callbackButton({ label: '➕ Основать корпорацию', payload: { command: 'corporation_controller', command_sub: 'corporation_add' }, color: 'secondary' }).row()
        .callbackButton({ label: '🔎 Быстрый поиск', payload: { command: 'corporation_controller', command_sub: 'corporation_finder' }, color: 'secondary' })
        event_logger = `💬 Вы еще не состоите в корпорации, как насчет основать свою или присоединится к существующей!\nЕсли хотите основать собственную, напишите основать корпорацию [название корпорации]`
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Corporation_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'corporation_add': Corporation_Add,
        'corporation_finder': Corporation_Finder, 
        'builder_config': Office_Config,
        'builder_destroy': Builder_Destroy,
        'builder_open': Office_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Corporation_Add() { }
async function Corporation_Finder(context: Context, user: User, target: number) {
    //let attached = await Image_Random(context, "beer")
    const corporation_list: Corporation[] = await prisma.corporation.findMany({ orderBy: { id: "desc" } })
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите корпорацию к которой хотели бы присоединиться: \n\n`
    const curva = context.eventPayload.office_current || 0
    const cur = context.eventPayload.target_current || 0
    if (context.eventPayload.selector || context.eventPayload.selector == 'zero') {
        const corporation_check: Corporation | null = await prisma.corporation.findFirst({ where: { id: Number(context.eventPayload.selector) } })
        if (!corporation_check) {
            await vk.api.messages.send({ peer_id: user.idvk, random_id: 0, message: `Корпорации не существует!` })
            return
        } else {
            const corporation_check_to: Corporation | null = await prisma.corporation.findFirst({ where: { id: Number(user.id_corporation) } })
            console.log(corporation_check_to)
            if (!corporation_check_to && await prisma.user.count({ where: { id_corporation: corporation_check.id } }) < corporation_check.member ) {
                await prisma.$transaction([
                    prisma.user.update({ where: { id: user.id }, data: { id_corporation: corporation_check.id } }),
                    prisma.user.findFirst({ where: { id: corporation_check.id_user } })
                ]).then(([user_change_corp, owner]) => {
                    if (user_change_corp) {
                        event_logger += `Вы вступили в корпорацию ${corporation_check.name}`
                        console.log(`${user.idvk} вступил в корпорацию ${corporation_check.name}`);
                        Send_Message(owner!.idvk, `@id${user.idvk}(${user.name}) вступает к вам в корпорацию!`)
                    }
                })
                .catch((error) => {
                    event_logger += `Ошибка при вступлении в корпорацию, попробуйте позже`
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                await vk.api.messages.send({ peer_id: user.idvk, random_id: 0, message: `В корпорации нет места для новых участников или игрок не состоит в корпорации!` })
            }
        }
        //await context.send(`${event_logger}`)
    } else {
        if (corporation_list.length > 0) {
            const limiter = 5
            let counter = 0
            for (let i=cur; i < corporation_list.length && counter < limiter; i++) {
                const corpa = corporation_list[i]
                //console.log(`cur: ${cur} i: ${i} counter: ${counter} ${JSON.stringify(builder)}`)
                const member_checker: number = await prisma.user.count({ where: { id_corporation: corpa.id } })
                if (counter < limiter && member_checker < corpa.member && member_checker > 0) {
                    keyboard.callbackButton({ label: `✅ ${member_checker}/${corpa.member}👥 ${corpa.name}-${corpa.id}`, payload: { command: 'corporation_controller', command_sub: 'corporation_finder', office_current: curva, target_current: cur, target: target, selector: corpa.id }, color: 'secondary' }).row()
                    event_logger += `💬 Корпорация: ${corpa.name}-${corpa.id}\n`;
                    counter++
                }
            }
            event_logger += `\n\n${corporation_list.length > 1 ? `~~~~ ${cur + corporation_list.length > cur+limiter ? limiter : limiter-(corporation_list.length-cur)} из ${corporation_list.length} ~~~~` : ''}`
            //предыдущий офис
            if (corporation_list.length > limiter && cur > limiter-1) {
                keyboard.callbackButton({ label: '←', payload: { command: 'corporation_controller', command_sub: 'corporation_finder', office_current: curva, target_current: cur-limiter, target: target }, color: 'secondary' })
            }
            //следующий офис
            if (corporation_list.length > limiter && cur < corporation_list.length-1) {
                keyboard.callbackButton({ label: '→', payload: { command: 'corporation_controller', command_sub: 'corporation_finder', office_current: curva, target_current: cur+limiter, target: target }, color: 'secondary' })
            }
        } else {
            event_logger = `В данный момент нет доступных целей...`
        }   
    }
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu_corporation', office_current: curva, target_current: cur, target: target }, color: 'secondary' }).inline().oneTime() 
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