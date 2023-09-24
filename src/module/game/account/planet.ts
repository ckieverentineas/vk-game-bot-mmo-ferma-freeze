import { User, Planet, System } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";
import { Randomizer_Float } from "../service";
import { Time_Controller } from "../player/service3";
import { icotransl_list } from "../datacenter/resources_translator";

const buildin: { [key: string]: { price: number, koef_price: number, description: string } } = {
    "Планета": { price: 100000, koef_price: 3, description: "Планета - место, где вы будете развивать свой бизнес и истощать ресурсы" },
    "Планета Мега": { price: 10, koef_price: 1, description: "Планета Мега - огромные планеты в далеких уголках галактики, еще больше ископаемых, много площадок" }
}

export async function Planet_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const planet_list: Planet[] = await prisma.planet.findMany({ where: { id_user: user.id } })
    let event_logger = `❄ Отдел управления планетами:\n\n`
    let cur = context.eventPayload.current_object ?? 0
    if (planet_list.length > 0) {
        const planet = planet_list[cur]
        const services_ans = await Time_Controller(context, user, planet.id)
		const build_counter = await prisma.builder.count({ where: { id_planet: planet.id } })
        keyboard.callbackButton({ label: `🏛 Здания`, payload: { command: 'builder_control', id_planet: planet.id  }, color: 'secondary' }).row()
        .callbackButton({ label: `👥 Люди`, payload: { command: 'worker_control', id_object: planet.id }, color: 'secondary' }).row()
		.callbackButton({ label: '💥 Уничтожить', payload: { command: 'planet_controller', command_sub: 'planet_destroy', id_object: planet.id }, color: 'secondary' })
        keyboard.callbackButton({ label: `♻`, payload: { command: 'planet_control', current_object: cur }, color: 'secondary' }).row()
        //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
        const worker_counter = await prisma.worker.count({ where: { id_planet: planet.id } });
        let count_worker_req = 0
        let count_worker_be = 0
        /*
        for (const builder of await prisma.builder.findMany({ where: { id_user: user.id, id_planet: planet.id } })) {
            const requires: Require[] = JSON.parse(builder.require)
            for (const require of requires) {
                if (require.name == 'worker') {
                    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id, } })
                    if (worker_check) {
                        count_worker_req += Math.floor(require.limit)
                        count_worker_be += worker_check
                    }
                }
            }
        }*/
        event_logger +=`💬 Планета: ${planet.name}-${planet.id}\n⚒ Зданий: ${build_counter}/${planet.build}\n${icotransl_list['artefact'].smile} Артефактов: ${planet.artefact.toFixed(2)}\n${icotransl_list['golden'].smile} Золото: ${planet.golden.toFixed(2)}\n${icotransl_list['iron'].smile} Железная руда: ${planet.iron.toFixed(2)}\n${icotransl_list['coal'].smile} Уголь: ${planet.coal.toFixed(2)}\n${icotransl_list['crystal_dirt'].smile} ${icotransl_list['crystal_dirt'].name}: ${planet.crystal.toFixed(2)}\n🏠 Население: ${worker_counter}\n👥 На работе: ${count_worker_be}/${count_worker_req}\n`;
        event_logger += `\n${services_ans}\n${planet_list.length > 1 ? `~~~~ ${1+cur} из ${planet_list.length} ~~~~` : ''}`
    } else {
        event_logger = `💬 Вы еще не имеете планет, как насчет поиметь их??`
    }
    
    //предыдущий обьект
    if (planet_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'planet_control', current_object: cur-1 }, color: 'secondary' })
    }
    //следующий обьект
    if (planet_list.length > 1 && cur < planet_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'planet_control', current_object: cur+1 }, color: 'secondary' })
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
    keyboard.callbackButton({ label: `➕`, payload: { command: 'planet_controller', command_sub: 'planet_add' }, color: 'secondary' })
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Planet_Controller(context: Context, user: User) {
    const target = context.eventPayload.id_object ?? 0
    const config: Object_Controller = {
        'planet_add': Planet_Add,
        'planet_destroy': Planet_Destroy,
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Object_Controller = {
    [key: string]: (context: Context, user: User, target?: number) => Promise<void>;
}
async function Planet_Usual(user: User, target: string) {
    const systema: System | null = await prisma.system.findFirst({ where: { id: 1 } })
    const planet_counter = await prisma.planet.count({ where: { id_user: user.id, name: target } })
    const sel = buildin[target]
    const price_new = sel.price*(planet_counter**sel.koef_price)
    let event_logger = ''
    if (user.energy >= price_new && user.energy > 0 && systema!.planet > 0) {
        await prisma.$transaction([
            prisma.planet.create({ data: { 
				id_user: user.id, id_system: 1, name: target, 
				coal: await Randomizer_Float(1000000, 1000000*2), 
				gas: await Randomizer_Float(50000, 50000*2), 
				oil: await Randomizer_Float(25000, 25000*2), 
				slate: await Randomizer_Float(10000, 10000*2),
				turf: await Randomizer_Float(5000, 5000*2), 
				uranium: await Randomizer_Float(1000, 1000*2),
				iron: await Randomizer_Float(1000000, 1000000*2),
				golden: await Randomizer_Float(1000000, 1000000*2),
				artefact: Math.floor(await Randomizer_Float(100, 100*2)),
				crystal: Math.floor(await Randomizer_Float(0, 5))
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
    return event_logger
}
async function Planet_Mega(user: User, target: string) {
    const systema: System | null = await prisma.system.findFirst({ where: { id: 1 } })
    const planet_counter = await prisma.planet.count({ where: { id_user: user.id, name: target } })
    const sel = buildin[target]
    const price_new = sel.price*(planet_counter**sel.koef_price)+10
    let event_logger = ''
    const mulmin = 5
    const mulmax = 3
    if (user.crystal >= price_new && user.crystal > 0 && systema!.planet > 0) {
        await prisma.$transaction([
            prisma.planet.create({ data: { 
				id_user: user.id, id_system: 1, name: target, 
				coal: await Randomizer_Float(1000000*mulmin, 1000000*mulmin*mulmax), 
				gas: await Randomizer_Float(50000*mulmin, 50000*mulmin*mulmax), 
				oil: await Randomizer_Float(25000*mulmin, 25000*mulmin*mulmax), 
				slate: await Randomizer_Float(10000, 10000*mulmax),
				turf: await Randomizer_Float(5000, 5000*mulmax), 
				uranium: await Randomizer_Float(1000*mulmin, 1000*mulmin*mulmax),
				iron: await Randomizer_Float(1000000*mulmin, 1000000*mulmin*mulmax),
				golden: await Randomizer_Float(1000000*mulmin, 1000000*mulmin*mulmax),
				artefact: Math.floor(await Randomizer_Float(100*mulmin, 100*mulmin*mulmax)),
				crystal: Math.floor(await Randomizer_Float(1, 25)),
                build: 15
			} }),
            prisma.user.update({ where: { id: user.id }, data: { crystal: { decrement: price_new } } }),
			prisma.system.update({ where: { id: 1}, data: { planet: { decrement: 1 } } })
        ]).then(([builder_new, user_pay, sys]) => {
            event_logger = `⌛ Поздравляем с колонизацией планеты ${builder_new.name}-${builder_new.id}.\n🏦 У вас было ${user.crystal} карат, затрачено на дальние перелеты ${price_new.toFixed(2)}, осталось: ${user_pay.crystal.toFixed(2)}\n\nВо вселенной осталось еще ${sys.planet.toFixed(0)} свободных планет` 
            console.log(`⌛ Поздравляем ${user.idvk} с колонизацией планеты ${builder_new.name}-${builder_new.id}.\n🏦 У вас было ${user.crystal} карат, затрачено на дальние перелеты ${price_new.toFixed(2)}, осталось: ${user_pay.crystal.toFixed(2)}\n\nВо вселенной осталось еще ${sys.planet.toFixed(0)} свободных планет`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка колонизации планеты, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    } else {
        event_logger = `⌛ У вас недостает ${(price_new-user.crystal).toFixed(2)} карат для колонизации новой планеты.`
    }
    return event_logger
}
type Planet_Selector = {
    [key: string]: (user: User, target: string) => Promise<string>;
}
async function Planet_Add(context: Context, user: User, ) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `❄ Выберите новую планету для постройки:\n\n`
	const systema: System | null = await prisma.system.findFirst({ where: { id: 1 } }) ? await prisma.system.findFirst({ where: { id: 1 } }) : await prisma.system.create({ data: { name: "Альтера", planet: Math.floor(await Randomizer_Float(1000000000000000000000000, 5000000000000000000000000)) } })
    console.log(`Во вселенной ${systema!.name} осталось ${systema!.planet.toFixed(0)} свободных планет`)
    if (context.eventPayload.selector) {
        const config: Planet_Selector = {
            'Планета': Planet_Usual,
            'Планета Мега': Planet_Mega,
        }
        event_logger += await config[context.eventPayload.selector](user, context.eventPayload.selector)
    } else {
        for (const builder of ['Планета', 'Планета Мега']) {
            const sel = buildin[builder]
            const planet_counter = await prisma.planet.count({ where: { id_user: user.id, name: builder } })
            const price_new = sel.price*(planet_counter**sel.koef_price)+10
            keyboard.callbackButton({ label: `➕ ${builder}`, payload: { command: 'planet_controller', command_sub: 'planet_add', current_object: 0, selector: builder }, color: 'secondary' }).row()
            event_logger += `\n\n💬 Планета: ${builder}\n ${sel.description}`;
            event_logger += builder == 'Планета' ? `\n⚙ Требование: ${price_new}/${user.energy.toFixed(2)}${icotransl_list['energy'].smile}` : ''
            event_logger += builder == 'Планета Мега' ? `\n⚙ Требование: ${price_new}/${user.crystal}${icotransl_list['crystal'].smile}` : ''
        }
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'planet_control', current_object: 0 }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

async function Planet_Destroy(context: Context, user: User, target?: number) {
    const keyboard = new KeyboardBuilder()
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id_user: user.id, id: target }})
    let event_logger = `В данный момент нельзя снести планету...`
    if (planet) {
        if (context.eventPayload.status == "ok") {
            await prisma.$transaction([
                prisma.planet.delete({ where: { id: planet.id } }),
            ]).then(([builder_del]) => {
                event_logger = `⌛ Поздравляем с уничтожением планеты ${builder_del.name}-${builder_del.id}.\n` 
                console.log(`⌛ Поздравляем ${user.idvk} с уничтожением планеты ${builder_del.name}-${builder_del.id}.`);
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка разрушения планеты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `Вы уверены, что хотите снести ${planet.name}-${planet.id}?`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'planet_controller', command_sub: 'planet_destroy', id_object: planet.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'planet_control' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}
