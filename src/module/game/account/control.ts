import { Corporation, User } from "@prisma/client";
import { vk } from "../../../";
import { Context, KeyboardBuilder } from "vk-io";
import prisma from "../../prisma";

async function User_Info(user: User) {
	const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
	let count_worker_req = 0
	for (const builder of await prisma.builder.findMany({ where: { id_user: user.id } })) {
		count_worker_req += builder.worker
	}
	const count_worker_be = await prisma.worker.count({ where: { id_user: user.id } })
    let event_logger = `💬 Ваш бизнес, ${user.name}:\n💳 UID: ${user.id}\n🎥 Кремлевский номер: ${user.idvk}\n🌐 Корпорация: ${user.id_corporation == 0? 'Не в корпорации' : corp?.name}\n📈 Уровень: ${user.lvl}\n📗 Опыт: ${user.xp.toFixed(2)}\n💰 Шекели: ${user.gold.toFixed(2)}\n📏 Железо: ${user.iron.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}\n💎 Караты: ${user.crystal}\n👥 Занято рабочих: ${count_worker_be}/${count_worker_req}\n`
	const keyboard = new KeyboardBuilder()
	keyboard.callbackButton({ label: '🌎 Планеты', payload: { command: 'planet_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '🌐 Корпорация', payload: { command: 'main_menu_corporation', stat: "health"  }, color: 'secondary' })
	//.callbackButton({ label: '🏛 Здания', payload: { command: 'builder_control', stat: "atk" }, color: 'secondary' })
	//.callbackButton({ label: '👥 Люди', payload: { command: 'worker_control', stat: "health"  }, color: 'secondary' }).row()
	//.callbackButton({ label: '📈 Прибыль', payload: { command: 'income_control', stat: "health"  }, color: 'secondary' })
	//.callbackButton({ label: '💰>⚡Биржа', payload: { command: 'exchange_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '❌', payload: { command: 'main_menu_close', stat: "mana" }, color: 'secondary' }).inline().oneTime() 
	return [keyboard, event_logger]
}
export async function User_Menu_Show(context: Context, user: User) {
	const [keyboard, event_logger] = await User_Info(user)
	await context.send(`${event_logger}`, { keyboard: keyboard } );
	/*await context.send(`⌛ Погода сегодня солнечная, но вы теперь не на заводе, владете заводом.`,
		{ 	
			keyboard: Keyboard.builder()
			.callbackButton({ label: 'Посмотреть бизнес', payload: { command: 'main_menu', security: `${user.idvk}${user.name}` }, color: 'positive' }).oneTime().inline()
		}
	);*/
}

export async function Main_Menu(context: Context, user: User) {
	const [keyboard, event_logger] = await User_Info(user)
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}
export async function Main_Menu_Close(context: Context, user: User) {
	await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `❄ Сессия успешно завершена, ${user.name}, чтобы начать новую, напишите [клава] без квадратных скобочек`, /*, attachment: attached.toString()*/ })
}