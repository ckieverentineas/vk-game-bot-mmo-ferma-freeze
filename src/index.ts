import { HearManager } from "@vk-io/hear";
import { Context, VK } from "vk-io";
import QuestionManager, { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";
import { User_Register } from "./module/game/account/tutorial";
import { Main_Menu, User_Menu_Show } from "./module/game/account/control";
import { Builder_Control, Builder_Controller } from "./module/game/account/builder";
import * as dotenv from 'dotenv';
dotenv.config();

export const token: string = process.env.token as string
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут

export const vk = new VK({ token: token, pollingGroupId: group_id, apiLimit: 1 });
//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();
//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);
//регистрация роутов из других классов

vk.updates.on('message_new', async (context: Context, next: any) => {
    console.log(`User:${context.senderId} sent ${context.text} from ${context.peerType}`)
	if (context.peerType == 'chat') { 
		return await next();
	}
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.user.findFirst({ where: { idvk: context.senderId } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) {
		await User_Register(context)
	} else {
		await User_Menu_Show(context, user_check)
	}
	return await next();
})
vk.updates.on('message_event', async (context: Context, next: any) => { 
	const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
	const security = context.eventPayload?.security || null
	if (security == `${user.idvk}${user.name}`) {
		await prisma.antiflud.update({ where: { id_user: user.id }, data: { id_message: String(context.conversationMessageId), busy: true }})
	} else {
		const security = await prisma.antiflud.findFirst({ where: { id_user: user.id } })
		if (context.conversationMessageId != security?.id_message) {
			await vk.api.messages.sendMessageEventAnswer({ event_id: context.eventId, user_id: context.userId, peer_id: context.peerId, event_data: JSON.stringify({ type: "show_snackbar", text: `🔔 Внимание, клавиатура устарела, получите новую!` }) })  
			return
		}
		if (security?.busy) {
			await vk.api.messages.sendMessageEventAnswer({ event_id: context.eventId, user_id: context.userId, peer_id: context.peerId, event_data: JSON.stringify({ type: "show_snackbar", text: `🔔 Внимание, мы вычисляем, имейте терпение!` }) })  
			return
		} else {
			await prisma.antiflud.update({ where: { id_user: user.id }, data: { busy: true }})
		}
		/*if (security?.date_message && new Date(security.date_message) >= 86400000) {

		}*/
	}
	//await Sleep(4000)
	
	console.log(`${context.eventPayload.command} > ${JSON.stringify(context.eventPayload)}`)
	const config: any = {
		"main_menu": Main_Menu,
		"builder_control": Builder_Control,
		"builder_controller": Builder_Controller,
		//"worker_control": Worker_Control,
	}
	try {
		await config[context.eventPayload.command](context, user)
	} catch (e) {
		await prisma.antiflud.update({ where: { id_user: user.id }, data: { busy: false }})
		console.log(`Ошибка события ${e}`)
	}
	await prisma.antiflud.update({ where: { id_user: user.id }, data: { busy: false }})
	return await next();
})

vk.updates.start().then(() => {
	console.log('Servers game industrial edition ready for services clients!')
}).catch(console.error);