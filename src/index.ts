import { HearManager } from "@vk-io/hear";
import { Context, VK } from "vk-io";
import QuestionManager, { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";
import { User_Register } from "./module/game/account/tutorial";
import { Main_Menu, Main_Menu_Close, User_Menu_Show } from "./module/game/account/control";
import { Builder_Control, Builder_Controller } from "./module/game/account/builder";
import * as dotenv from 'dotenv';
import { Worker_Control, Worker_Controller } from "./module/game/account/worker";
import { Exchange_Control, Income_Control } from "./module/game/account/service";
import { registerUserRoutes } from "./player";
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
registerUserRoutes(hearManager)

vk.updates.on('message_new', async (context: Context, next: any) => {
    console.log(`User:${context.senderId} sent ${context.text} from ${context.peerType}`)
	if (context.peerType == 'chat') { 
		return await next();
	}
	if ((typeof context.text === 'string' || context.text instanceof String) && (context.text.toLowerCase() == 'начать' || context.text.toLowerCase() == "клава")) {
		//проверяем есть ли пользователь в базах данных
		const user_check = await prisma.user.findFirst({ where: { idvk: context.senderId } })
		//если пользователя нет, то начинаем регистрацию
		if (!user_check) {
			await User_Register(context)
		} else {
			await User_Menu_Show(context, user_check)
		}
	}
	return await next();
})
vk.updates.on('like_add', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const whitelist = ['post', 'comment']
	if ( !whitelist.includes(context.objectType) ) { return await next() }
	const user_check = await prisma.user.findFirst({ where: { idvk: context.likerId } })
	console.log(context)
	if (user_check ) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { increment: 5 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Вам начислено вознаграждение за лайк ${context.objectType} 5⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})
vk.updates.on('like_remove', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const whitelist = ['post', 'comment']
	if ( !whitelist.includes(context.objectType) ) { return await next() }
	const user_check = await prisma.user.findFirst({ where: { idvk: context.likerId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { decrement: 5 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Штраф за снятие лайка с ${context.objectType} 5⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})
/*vk.updates.on('photo_comment_delete', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.user.findFirst({ where: { idvk: context.deleterUserId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { decrement: 10 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Штраф за удаление комментария с фото ${context.type} 10⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})
vk.updates.on('video_comment_delete', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.user.findFirst({ where: { idvk: context.deleterUserId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { decrement: 10 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Штраф за удаление комментария с видео ${context.type} 10⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})*/
vk.updates.on('wall_reply_delete', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	console.log(context)
	const user_check = await prisma.user.findFirst({ where: { idvk: context.deleterUserId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { decrement: 10 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Штраф за удаление комментария с поста ${context.type} 10⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})
vk.updates.on('message_event', async (context: Context, next: any) => { 
	const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
	//await Sleep(4000)
	console.log(`${context.eventPayload.command} > ${JSON.stringify(context.eventPayload)}`)
	const config: any = {
		"main_menu": Main_Menu,
		"main_menu_close": Main_Menu_Close,
		"builder_control": Builder_Control,
		"builder_controller": Builder_Controller,
		"worker_control": Worker_Control,
		"worker_controller": Worker_Controller,
		"income_control": Income_Control,
		"exchange_control": Exchange_Control
	}
	try {
		await config[context.eventPayload.command](context, user)
	} catch (e) {
		console.log(`Ошибка события ${e}`)
	}
	return await next();
})

vk.updates.start().then(() => {
	console.log('Servers game industrial edition ready for services clients!')
}).catch(console.error);