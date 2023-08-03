import { User, Builder, Corporation_Builder, Corporation } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

const buildin: { [key: string]: { price: number, income: number, cost: number, koef_price: number, koef_income: number, type: string, smile: string, description: string, income_description: string } } = {
    "Фабрикатор": { price: 500, income: 5, cost: 500, koef_price: 1.3838, koef_income: 0.0305, type: 'gold', smile: '💰', description: "Фабрикатор, секретная технология корпорации, позволяющая клонировать часть прибыли на шекельный счет корпорации", income_description: "Клонирование" },
    "Банк": { price: 500, income: 5, cost: 500, koef_price: 1.3838, koef_income: 0.0305, type: 'gold', smile: '💰', description: "Банк, корпоративная финансовая система, при использовании которой вам возвращается часть налогов с прибыли", income_description: "Доход"  }
}

export async function Builder_Control_Corporation(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const builder_list: Corporation_Builder[] = await prisma.corporation_Builder.findMany({ where: { id_corporation: user.id_corporation } })
    let event_logger = `❄ Отдел управления постройками корпорации:\n\n`
    let cur = context.eventPayload.office_current ?? 0
    const builder = builder_list[cur]
    const corp = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    const leader = await prisma.user.findFirst({ where: { id: corp?.id_user || 1 }})
    if (builder_list.length > 0) {
        const sel = buildin[builder.name]
        const lvl_new = builder.lvl+1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        
        if (user.idvk == leader?.idvk) {
            keyboard.callbackButton({ label: `🔧 ${price_new.toFixed(2)}💰`, payload: { command: 'builder_controller_corporation', command_sub: 'builder_upgrade_corporation', office_current: cur, target: builder.id  }, color: 'secondary' }).row()
        }
        //.callbackButton({ label: '💥 Разрушить', payload: { command: 'builder_controller', command_sub: 'builder_destroy_corporation', office_current: cur, target: builder.id }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        event_logger +=`💬 Здание: ${builder.name}-${builder.id}\n📈 Уровень: ${builder.lvl}\n📗 Опыт: ${builder.xp.toFixed(2)}\n💰 Вложено: ${builder.cost.toFixed(2)}\n${buildin[builder.name].smile} ${sel.income_description}: ${builder.income.toFixed(2)}%\n👥 Рабочих: ${builder.worker}\n\n${builder_list.length > 1 ? `~~~~ ${1+cur} из ${builder_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не построили корпоративные здания, как насчет что-то построить??`
    }
    
    //предыдущий офис
    if (builder_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'builder_control_corporation', office_current: cur-1, target: builder.id }, color: 'secondary' })
    }
    //следующий офис
    if (builder_list.length > 1 && cur < builder_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'builder_control_corporation', office_current: cur+1, target: builder.id }, color: 'secondary' })
    }
    //новый офис
    if (user.idvk == leader?.idvk) {
        keyboard.callbackButton({ label: '➕', payload: { command: 'builder_controller_corporation', command_sub: 'builder_add_corporation' }, color: 'secondary' })
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu_corporation' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Builder_Controller_Corporation(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'builder_add_corporation': Builder_Add_Corporation,
        'builder_upgrade_corporation': Builder_Upgrade_Corporation, 
        'builder_config_corporation': Office_Config,
        'builder_destroy_corporation': Builder_Destroy,
        'builder_open_corporation': Office_Open
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Builder_Add_Corporation(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новое здание для стройки:\n\n`
    if (context.eventPayload.selector) {
        const sel = buildin[context.eventPayload.selector]
        const lvl_new = 1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        const worker_new = lvl_new/10 >= 1 ? Math.floor(lvl_new/10) : 1
        const income_new = sel.income*(lvl_new**sel.koef_income)
        const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
        if (corp && corp.gold >= price_new) {
            await prisma.$transaction([
                prisma.corporation_Builder.create({ data: { id_corporation: user.id_corporation, name: context.eventPayload.selector, income: income_new, worker: worker_new, cost: price_new, type: sel.type } }),
                prisma.corporation.update({ where: { id: user.id_corporation }, data: { gold: { decrement: price_new } } })
            ]).then(([builder_new, user_pay]) => {
                event_logger = `⌛ В корпорации построено ${builder_new.name}-${builder_new.id}.\n🏦 На счете корпорации было ${corp.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}` 
                console.log(`⌛ В корпорации ${corp.name} построено ${builder_new.name}-${builder_new.id}.\n🏦 На счете корпорации было ${corp.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_pay.gold.toFixed(2)}`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка приобретения нового здания, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `⌛ На банковском счете корпорации недостает ${(price_new-corp!.gold).toFixed(2)} шекелей для постройки нового здания.`
        }
    } else {
        for (const builder of ['Банк', 'Фабрикатор']) {
            const check_builds = await prisma.corporation_Builder.findFirst({ where: { id_corporation: user.id_corporation, name: builder }})
            if (check_builds) { continue }
            const sel = buildin[builder]
            const lvl_new = 1
            const price_new = sel.price*(lvl_new**sel.koef_price)
            keyboard.callbackButton({ label: `➕ ${builder} ${price_new}💰`, payload: { command: 'builder_controller_corporation', command_sub: 'builder_add_corporation', office_current: 0, target: target, selector: builder }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Здание: ${builder}\n${buildin[builder].smile} ${sel.income_description}: ${sel.income.toFixed(2)}% в час\n ${sel.description}`;
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control_corporation', office_current: 0, target: target }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Upgrade_Corporation(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const builder: Corporation_Builder | null = await prisma.corporation_Builder.findFirst({ where: { id_corporation: user.id_corporation, id: target }})
    let event_logger = `В данный момент здание корпорации нельзя улучшить...`
    if (builder) {
        const sel = buildin[builder.name]
        const lvl_new = builder.lvl+1
        const price_new = sel.price*(lvl_new**sel.koef_price)
        const worker_new = lvl_new/10 >= 1 ? Math.floor(lvl_new/10) : 1
        const income_new = sel.income*(lvl_new**sel.koef_income)
        const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
        if (context.eventPayload.status == "ok") {
            if (corp && corp.gold >= price_new) {
                await prisma.$transaction([
                    prisma.corporation_Builder.update({ where: { id: builder.id }, data: { lvl: lvl_new, worker: worker_new, income: income_new, cost: { increment: price_new } } }),
                    prisma.corporation.update({ where: { id: user.id_corporation }, data: { gold: { decrement: price_new } } })
                ]).then(([builder_up, user_up]) => {
                    event_logger = `⌛ Поздравляем с улучшением уровня корпоративного здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n🏦 На счете корпорации было ${corp.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_up.gold.toFixed(2)}` 
                    console.log(`⌛ Поздравляем ${corp.name} с улучшением корпоративного здания ${builder_up.name}-${builder_up.id} с ${builder.lvl} на ${builder_up.lvl}.\n🏦 На счете корпорации было ${corp.gold.toFixed(2)} шекелей, снято ${price_new.toFixed(2)}, остаток: ${user_up.gold.toFixed(2)}`);
                    //keyboard.callbackButton({ label: '👀', payload: { command: 'office', office_current: context.eventPayload.office_current, target: office_upgrade.id }, color: 'secondary' })
                })
                .catch((error) => {
                    event_logger = `⌛ Произошла ошибка прокачки корпоративных здания, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                event_logger += `\n На банковском счете корпорации недостает ${(price_new-corp!.gold).toFixed(2)} шекелей.`
            }
        } else {
            event_logger = `Вы уверены, что хотите улучшить здание корпорации ${builder.name}-${builder.id} за ${price_new.toFixed(2)} при балансе ${corp!.gold.toFixed(2)}💰?\n\n Параметры вырастут следующим образом:\n${buildin[builder.name].smile} ${sel.income_description}: ${builder.income.toFixed(2)} --> ${income_new.toFixed(2)}\n👥 Рабочих: ${builder.worker} --> ${worker_new}\n`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'builder_controller_corporation', command_sub: 'builder_upgrade_corporation', office_current: 0, target: builder.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'builder_control_corporation', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
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