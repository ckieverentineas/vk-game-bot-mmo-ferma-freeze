import { Corporation, User } from "@prisma/client";
import { vk } from "../../../";
import { Context, KeyboardBuilder } from "vk-io";
import prisma from "../../prisma";
import { icotransl_list } from "../datacenter/resources_translator";
import { Require } from "../datacenter/builder_config";

async function User_Info(user: User) {
	const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
	let count_worker_req = 0
	let count_worker_be = 0
	for (const builder of await prisma.builder.findMany({ where: { id_user: user.id } })) {
		const requires: Require[] = JSON.parse(builder.require)
		for (const require of requires) {
			if (require.name == 'worker') {
				const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
				if (worker_check) {
					count_worker_req += Math.floor(require.limit)
					count_worker_be += worker_check
				}
			}
		}
	}
    let event_logger = `💬 Ваш бизнес, ${user.name}:\n💳 UID: ${user.id}\n🎥 Кремлевский номер: ${user.idvk}\n🌐 Корпорация: ${user.id_corporation == 0? 'Не в корпорации' : corp?.name}\n📈 Уровень: ${user.lvl}\n📗 Опыт: ${user.xp.toFixed(2)}\n💰 Шекели: ${user.gold.toFixed(2)}\n${icotransl_list['metal'].smile} ${icotransl_list['metal'].name}: ${user.iron.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}\n${icotransl_list['research'].smile} Очки исследования: ${user.research.toFixed(2)}\n💎 Караты: ${user.crystal}\n👥 Население (есть/надо): ${count_worker_be}/${count_worker_req}\n`
	const keyboard = new KeyboardBuilder()
	keyboard.callbackButton({ label: '🌎 Планеты', payload: { command: 'planet_control' }, color: 'secondary' }).row()
	.callbackButton({ label: '🌐 Корпорация', payload: { command: 'main_menu_corporation' }, color: 'secondary' }).row()
	.callbackButton({ label: '🧪 Исследования', payload: { command: 'research_control' }, color: 'secondary' }).row()
	.urlButton({ label: '🍻 Об игре', url: 'https://vk.com/@ferma_bot1-dobro-pozhalovat-v-mmo-ekonomicheskuu-biznes-strategiu' }).row()
	//.callbackButton({ label: '📈 Прибыль', payload: { command: 'income_control', stat: "health"  }, color: 'secondary' })
	//.callbackButton({ label: '💰>⚡Биржа', payload: { command: 'exchange_control', stat: "health"  }, color: 'secondary' }).row()
	.callbackButton({ label: '❌', payload: { command: 'main_menu_close' }, color: 'secondary' }).inline().oneTime() 
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
	const keyboard = new KeyboardBuilder()
	keyboard.textButton({ label: 'КЛАВА', payload: { command: 'planet_control', stat: "health"  }, color: 'secondary' }).row().inline().oneTime() 
	await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `❄ Сессия успешно завершена, ${user.name}, чтобы начать новую, напишите [клава] без квадратных скобочек`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}