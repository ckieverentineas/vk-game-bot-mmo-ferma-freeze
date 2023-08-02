import { Corporation, User } from "@prisma/client";
import { vk } from "../../../";
import { Context, KeyboardBuilder } from "vk-io";
import prisma from "../../prisma";

export async function User_Menu_Show(context: Context, user: User) {
	const keyboard = new KeyboardBuilder()
	const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    let event_logger = `💬 Ваш бизнес, ${user.name}:\n💳 UID: ${user.id}\n🎥 Кремлевский номер: ${user.idvk}\n🌐 Корпорация: ${user.id_corporation == 0? 'Не в корпорации' : corp?.name}\n📈 Уровень: ${user.lvl}\n📗 Опыт: ${user.xp.toFixed(2)}\n💰 Шекели: ${user.gold.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}`
    keyboard.callbackButton({ label: '🏛 Здания', payload: { command: 'builder_control', stat: "atk" }, color: 'secondary' })
    .callbackButton({ label: '👥 Люди', payload: { command: 'worker_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '📈 Прибыль', payload: { command: 'income_control', stat: "health"  }, color: 'secondary' })
	.callbackButton({ label: '💰>⚡Биржа', payload: { command: 'exchange_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '🌐 Корпорация', payload: { command: 'main_menu_corporation', stat: "health"  }, color: 'secondary' })
    .callbackButton({ label: '❌', payload: { command: 'main_menu_close', stat: "mana" }, color: 'secondary' }).inline().oneTime() 
	await context.send(`${event_logger}`, { keyboard: keyboard } );
	/*await context.send(`⌛ Погода сегодня солнечная, но вы теперь не на заводе, владете заводом.`,
		{ 	
			keyboard: Keyboard.builder()
			.callbackButton({ label: 'Посмотреть бизнес', payload: { command: 'main_menu', security: `${user.idvk}${user.name}` }, color: 'positive' }).oneTime().inline()
		}
	);*/
}

export async function Main_Menu(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `💬 Ваш бизнес, ${user.name}:\n💳 UID: ${user.id}\n🎥 Кремлевский номер: ${user.idvk}\n🌐 Корпорация: ${user.id_corporation == 0? 'Не в корпорации' : 'Корпа'}\n📈 Уровень: ${user.lvl}\n📗 Опыт: ${user.xp.toFixed(2)}\n💰 Шекели: ${user.gold.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}`
    keyboard.callbackButton({ label: '🏛 Здания', payload: { command: 'builder_control', stat: "atk" }, color: 'secondary' })
    .callbackButton({ label: '👥 Люди', payload: { command: 'worker_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '📈 Прибыль', payload: { command: 'income_control', stat: "health"  }, color: 'secondary' })
	.callbackButton({ label: '⚡>💰Биржа', payload: { command: 'exchange_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '🌐 Корпорация', payload: { command: 'main_menu_corporation', stat: "health"  }, color: 'secondary' })
    .callbackButton({ label: '❌', payload: { command: 'main_menu_close', stat: "mana" }, color: 'secondary' }).inline().oneTime()        
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}
export async function Main_Menu_Close(context: Context, user: User) {
	await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `❄ Сессия успешно завершена, ${user.name}, чтобы начать новую, напишите [клава] без квадратных скобочек`, /*, attachment: attached.toString()*/ })
}