import { User, Builder, Planet, System } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { Randomizer_Float } from "../service";
import { Time_Controller } from "../player/service";

const buildin: { [key: string]: { price: number, koef_price: number, description: string } } = {
    "Планета": { price: 100000, koef_price: 10, description: "Планета - место, где вы будете развивать свой бизнес и истощать ресурсы" }
}

export async function Planet_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const planet_list: Planet[] = await prisma.planet.findMany({ where: { id_user: user.id } })
    let event_logger = `❄ Отдел управления планетами:\n\n`
    let cur = context.eventPayload.current_object ?? 0
    const planet = planet_list[cur]
    await Time_Controller(context, user, planet.id)
    if (planet_list.length > 0) {
		const build_counter = await prisma.builder.count({ where: { id_planet: planet.id } })
        keyboard.callbackButton({ label: `🏛 Здания`, payload: { command: 'builder_control', id_planet: planet.id  }, color: 'secondary' }).row()
        .callbackButton({ label: `👥 Люди`, payload: { command: 'worker_control', id_object: planet.id }, color: 'secondary' }).row()
		//.callbackButton({ label: '💥 Уничтожить', payload: { command: 'planet_controller', command_sub: 'planet_destroy', id_object: planet.id }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        event_logger +=`💬 Планета: ${planet.name}-${planet.id}\n⚒ Зданий: ${build_counter}/${planet.build}\n⚱️ Артефактов: ${planet.artefact}\n🧈 Золотых слитков: ${planet.golden.toFixed(2)}\n🧈 Железных слитков: ${planet.iron.toFixed(2)}\n🏙 Угля: ${planet.coal.toFixed(2)}\n\n${planet_list.length > 1 ? `~~~~ ${1+cur} из ${planet_list.length} ~~~~` : ''}`;
    } else {
        event_logger = `💬 Вы еще не имеете планет, как насчет поиметь их??`
    }
    //следующий обьект
    if (planet_list.length > 1 && cur < planet_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'planet_control', current_object: cur+1 }, color: 'secondary' })
    }
    //предыдущий обьект
    if (planet_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'planet_control', current_object: cur-1 }, color: 'secondary' })
    }
    
    if (planet_list.length > 5) {
        if ( cur < planet_list.length/2) {
            //последний обьект
            keyboard.callbackButton({ label: '→🕯', payload: { command: 'planet_control', current_object: planet_list.length-1 }, color: 'secondary' })
        } else {
            //первый обьект
            keyboard.callbackButton({ label: '←🕯', payload: { command: 'planet_control', current_object: 0 }, color: 'secondary' })
        }
    }
    //новый обьект
	const planet_counter = await prisma.planet.count({ where: { id_user: user.id } })
    keyboard.callbackButton({ label: `➕ ${planet_counter*10000*(planet_counter*1000)}⚡`, payload: { command: 'planet_controller', command_sub: 'planet_add' }, color: 'secondary' })
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Planet_Controller(context: Context, user: User) {
    const target = context.eventPayload.id_object ?? 0
    const config: Object_Controller = {
        'planet_add': Planet_Add,
        'builder_destroy': Builder_Destroy,
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Object_Controller = {
    [key: string]: (context: Context, user: User, target?: number) => Promise<void>;
}

async function Planet_Add(context: Context, user: User, ) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новую планету для постройки:\n\n`
	const systema: System | null = await prisma.system.findFirst({ where: { id: 1 } }) ? await prisma.system.findFirst({ where: { id: 1 } }) : await prisma.system.create({ data: { name: "Альтера", planet: Math.floor(await Randomizer_Float(1000000000000000000000000, 5000000000000000000000000)) } })
	const planet_counter = await prisma.planet.count({ where: { id_user: user.id } })
    if (context.eventPayload.selector) {
        const sel = buildin[context.eventPayload.selector]
        const price_new = sel.price*(planet_counter**sel.koef_price)
        if (user.energy >= price_new && user.energy > 0 && systema!.planet > 0) {
            await prisma.$transaction([
                prisma.planet.create({ data: { 
					id_user: user.id, id_system: 1, name: context.eventPayload.selector, 
					coal: await Randomizer_Float(1000000, 1000000*(planet_counter+2)), 
					gas: await Randomizer_Float(50000, 50000*(planet_counter+2)), 
					oil: await Randomizer_Float(25000, 25000*(planet_counter+2)), 
					slate: await Randomizer_Float(10000, 10000*(planet_counter+2)),
					turf: await Randomizer_Float(5000, 5000*(planet_counter+2)), 
					uranium: await Randomizer_Float(1000, 1000*(planet_counter+2)),
					iron: await Randomizer_Float(1000000, 1000000*(planet_counter+2)),
					golden: await Randomizer_Float(1000000, 1000000*(planet_counter+2)),
					artefact: Math.floor(await Randomizer_Float(100, 100*(planet_counter+2))),
					crystal: Math.floor(await Randomizer_Float(10, 100))
				} }),
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: price_new } } }),
				prisma.system.update({ where: { id: 1}, data: { planet: { decrement: 1 } } })
            ]).then(([builder_new, user_pay, sys]) => {
                event_logger = `⌛ Поздравляем с колонизацией планеты ${builder_new.name}-${builder_new.id}.\n🏦 У вас было ${user.energy.toFixed(2)} энергии, затрачено на перелеты ${price_new.toFixed(2)}, осталось: ${user_pay.energy.toFixed(2)}\n\nВо вселенной осталось еще ${sys.planet.toFixed(0)} свободных планет` 
                console.log(`⌛ Поздравляем ${user.idvk} с колонизацией планеты ${builder_new.name}-${builder_new.id}.\n🏦 У вас было ${user.energy.toFixed(2)} энергии, затрачено на перелеты ${price_new.toFixed(2)}, осталось: ${user_pay.energy.toFixed(2)}`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка колонизации планеты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `⌛ У вас недостает ${(price_new-user.energy).toFixed(2)} энергии для колонизации новой планеты.`
        }
    } else {
        for (const builder of ['Планета']) {
            const sel = buildin[builder]
            const price_new = sel.price*(planet_counter**sel.koef_price)
            keyboard.callbackButton({ label: `➕ ${builder} ${price_new}⚡`, payload: { command: 'planet_controller', command_sub: 'planet_add', current_object: 0, selector: builder }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Планета: ${builder}\n ${sel.description}`;
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'planet_control', current_object: 0 }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Builder_Destroy(context: Context, user: User, target?: number) {
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
