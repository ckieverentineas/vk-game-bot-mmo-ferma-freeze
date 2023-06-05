import { User } from "@prisma/client";
import { vk } from "../../../";
import prisma from "../../prisma";
import { Context, Keyboard, KeyboardBuilder } from "vk-io";

export async function User_Menu_Show(context: Context, user: User) {
    const datenow: any = new Date()
	const dateold: any = user.update
	if (datenow - dateold > 1000) {
		await context.send(`⌛ Погода сегодня солнечная, но вы теперь не на заводе, владете заводом.`,
			{ 	
				keyboard: Keyboard.builder()
				.callbackButton({ label: 'Посмотреть бизнес', payload: { command: 'user_info', security: `${user.idvk}${user.name}` }, color: 'positive' }).oneTime().inline()
			}
		);
		await prisma.antiflud.upsert({ create: { id_user: user.id, id_message: '0', date_message: new Date(), busy: false}, update: { id_message: '0', date_message: new Date(), busy: false}, where: { id_user: user.id} })
		await prisma.user.update({ where: { id: user.id}, data: { update: datenow } })
	} else {
		await context.send(`🔔 Вы уже получали клавиатуру в: ${dateold.getDate()}-${dateold.getMonth()}-${dateold.getFullYear()} ${dateold.getHours()}:${dateold.getMinutes()}!\nПриходите через ${((86400000-(datenow-dateold))/60000/60).toFixed(2)} часов.`)
	}
}

export async function User_Info(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = `💬 Ваш бизнес, ${user.name}:\n💳 UID: ${user.id}\n🎥 Кремлевский номер: ${user.idvk}\n📈 Уровень: ${user.lvl}\n📗 Опыт: ${user.xp}\n💰 Шекели: ${user.gold}\n⚡ Энергия: ${user.energy}`
    keyboard.callbackButton({ label: 'Офис', payload: { command: 'user_add_stat', stat: "atk" }, color: 'secondary' })
    .callbackButton({ label: 'Фабрики', payload: { command: 'user_add_stat', stat: "health"  }, color: 'secondary' }).row()
    .callbackButton({ label: 'Рабочие', payload: { command: 'user_add_stat', stat: "mana" }, color: 'secondary' }).inline().oneTime()        
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}