import { HearManager } from "@vk-io/hear";
import { Context, VK } from "vk-io";
import QuestionManager, { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";
import { User_Register } from "./module/game/account/tutorial";
import { Main_Menu, Main_Menu_Close, User_Menu_Show } from "./module/game/account/control";
import { Builder_Control, Builder_Controller } from "./module/game/player/builder3";
import * as dotenv from 'dotenv';
import { Worker_Control, Worker_Controller } from "./module/game/account/worker";
import { registerUserRoutes } from "./player";
import { Rand_Int } from "./module/fab/random";
import { Corporation_Controller, Main_Menu_Corporation } from "./module/game/corporation/corporation";
import { Builder_Control_Corporation, Builder_Controller_Corporation } from "./module/game/corporation/builder";
import { Member_Control, Member_Controller } from "./module/game/corporation/member";
import { Trigger } from "@prisma/client";
import { Planet_Control, Planet_Controller } from "./module/game/account/planet";
import { Send_Message, Sleep } from "./module/fab/helper";
import { Research_Control, Research_Controller } from "./module/game/player/research";
import { icotransl_list } from "./module/game/datacenter/resources_translator";
import { Randomizer_Float } from "./module/game/service";
dotenv.config();

export const token: string = process.env.token as string
const token_user_nafig: string = process.env.token_user as string
export const root: string[] = process.env.root!.split(', '); //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут

export const vk = new VK({ token: token, pollingGroupId: group_id, apiLimit: 1 });
export const vk_user = new VK({ token: token_user_nafig, pollingGroupId: undefined, apiLimit: 1 });
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
			if (user_check.status == "banned") { return await next() }
			await User_Menu_Show(context, user_check)
		}
	}
	return await next();
})
vk.updates.on('like_add', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const whitelist = ['post'/*, 'comment' */]
	if ( !whitelist.includes(context.objectType) ) { return await next() }
	const user_check = await prisma.user.findFirst({ where: { idvk: context.likerId } })
	//console.log(context)
	if (user_check ) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { gold: { increment: 100 }, iron: { increment: 50 }, energy: { increment: 25 } } })
		await Send_Message(user_gift.idvk, `⚙ Вам начислено вознаграждение за лайк ${context.objectType} 100${icotransl_list['gold'].smile} 50${icotransl_list['metal'].smile} 25${icotransl_list['energy'].smile}. Ваш баланс ${user_gift.gold.toFixed(2)}${icotransl_list['gold'].smile} ${user_gift.iron.toFixed(2)}${icotransl_list['metal'].smile} ${user_gift.energy.toFixed(2)}${icotransl_list['energy'].smile}`)
	}
	return await next();
})
vk.updates.on('like_remove', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	const whitelist = ['post'/*, 'comment' */]
	if ( !whitelist.includes(context.objectType) ) { return await next() }
	const user_check = await prisma.user.findFirst({ where: { idvk: context.likerId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { gold: { decrement: 100 } } })
		await Send_Message(user_gift.idvk, `⚙ Штраф за снятие лайка с ${context.objectType} 100💰. Ваш баланс ${user_gift.gold.toFixed(2)}`)
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
})
vk.updates.on('wall_reply_delete', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	console.log(context)
	const user_check = await prisma.user.findFirst({ where: { idvk: context.deleterUserId } })
	if (user_check) {
		const user_gift = await prisma.user.update({ where: { id: user_check.id }, data: { energy: { decrement: 10 } } })
		await vk.api.messages.send({ peer_id: user_gift.idvk, random_id: 0, message: `⚙ Штраф за удаление комментария с поста ${context.type} 10⚡. Ваш баланс ${user_gift.energy.toFixed(2)}` })
	}
	return await next();
})*/

vk.updates.on('wall_reply_new', async (context: Context, next: any) => {
	//проверяем есть ли пользователь в базах данных
	console.log(context)
	const post_check = await prisma.boss.findFirst({ where: { id_post: context.objectId }})
	const user_check = await prisma.user.findFirst({ where: { idvk: context.fromId } })
	if (user_check && post_check) {
		if (post_check.hp > 0) {
			const dmg = await Randomizer_Float(1, 10)
			const artefact_drop = await Randomizer_Float(0, 10) > dmg && post_check.artefact >= dmg ? dmg : 0
			const stata: { idvk: number, update: Date, atk: number }[] = JSON.parse(post_check.stat)
			const datenow: Date = new Date()
			let trigself = false
			for (let i = 0; i < stata.length; i++) {
				if (stata[i].idvk == user_check.idvk) {
					trigself = true
					const dateold: Date = new Date(stata[i].update)
					if ((Number(datenow)-Number(dateold)) > 10000) {
						stata[i].atk += dmg
						stata[i].update = datenow
					} else {
						await vk.api.wall.createComment({owner_id: context.ownerId, post_id: context.objectId, reply_to_comment: context.id, guid: context.text, message: `🔕 Подождите до следующего действия еще ${((10000-(Number(datenow)-Number(dateold)))/1000).toFixed(2)} секунд`})
						return await next();
					}
				}
			}
			if (!trigself) { stata.push({ idvk: user_check.idvk, update: datenow, atk: dmg })}
			stata.sort(function(a, b){
                return b.atk - a.atk;
            });
			let counter_last = 1
            let trig_find_me = false
			let messa = ''
            for (const stat_sel of stata) {
                if (counter_last <= 10) {
                    messa += `\n${stat_sel.idvk == user_check.idvk ? '✅' : '👤'} ${counter_last}) ${stat_sel.atk.toFixed(2)}💥 <-- [https://vk.com/id${stat_sel.idvk}|Повелитель${counter_last}]`
                    if (stat_sel.idvk == user_check.idvk) { trig_find_me = true }
                }
                if (counter_last > 10 && !trig_find_me) {
                    if (stat_sel.idvk == user_check.idvk) {
                        messa += `\n\n${stat_sel.idvk == user_check.idvk ? '✅' : '👤'} ${counter_last}) ${stat_sel.atk.toFixed(2)}💥 <-- [https://vk.com/id${stat_sel.idvk}|Повелитель${counter_last}]`
                    }
                }
                counter_last++
            }
            messa += `\n\n☠ В статистие участвует ${counter_last-1} игроков`
			const boss = await prisma.boss.update({ where: { id: post_check.id }, data: { hp: { decrement: dmg }, artefact: { decrement: artefact_drop }, stat: JSON.stringify(stata) } })
			await prisma.planet.updateMany({ where: { id_user: user_check.id }, data: { artefact: { increment: artefact_drop } } })
			await vk.api.wall.createComment({owner_id: context.ownerId, post_id: context.objectId, reply_to_comment: context.id, guid: context.text, message: `🔔 Вы нанесли ${dmg.toFixed(2)}💥 урона боссу, у него осталось ${boss.hp.toFixed(2)}❤. ${artefact_drop > 0 ? `Выпало ${artefact_drop}${icotransl_list['artefact'].smile}` : ''}`})
			if ((Number(datenow)-Number(post_check.update)) > 1000000) {
				await vk_user.api.wall.edit({ owner_id: -group_id, post_id: post_check.id_post, message: `☠ Босс: ${boss.name}\n❤ Здоровье: ${boss.hp.toFixed(2)}\n🏆 Дроп: ${boss.artefact.toFixed(2)}${icotransl_list['artefact'].smile} ${boss.crystal.toFixed(2)}${icotransl_list['crystal'].smile}\n💬 Описание: ${boss.description}\n\n📊 Статистика:\n${messa}` })
				await prisma.boss.update({ where: { id: post_check.id }, data: { update: new Date(datenow) } })
			}
		} else {
			if (!post_check.defeat) {
				let reward_price = 0
				const stata: { idvk: number, update: Date, atk: number }[] = JSON.parse(post_check.stat)
				stata.sort(function(a, b){
					return b.atk - a.atk;
				});
				for (const stat of stata) {
					reward_price += stat.atk
				}
				const reward_koef = reward_price/post_check.crystal
				let rang = 1
				for (const stat of stata) {
					const user_get = await prisma.user.findFirst({ where: { idvk: stat.idvk } })
					const user_up = await prisma.user.update({ where: { id: user_get!.id}, data: { crystal: { increment: Math.floor(stat.atk/reward_koef)}}})
					await Send_Message(stat.idvk, `За победу над ${post_check.name} вы получаете ${Math.floor(stat.atk/reward_koef)}${icotransl_list['crystal']} заняв ${rang} место из ${stata.length}. Баланс: ${user_get?.crystal} --> ${user_up.crystal}`)
					rang++
				}
				await vk_user.api.wall.edit({ owner_id: -group_id, post_id: post_check.id_post, message: `☠ Босс: ${post_check.name}\n❤ Здоровье: ${post_check.hp.toFixed(2)}\n🏆 Дроп: ${post_check.artefact.toFixed(2)}${icotransl_list['artefact'].smile} ${post_check.crystal.toFixed(2)}${icotransl_list['crystal'].smile}\n💬 Описание: ${post_check.description}\n\n📊 Статистика: БОСС ПОВЕРЖЕН!` })
				await prisma.boss.update({ where: { id: post_check.id }, data: { defeat: true } })
			}
		}
	}
	return await next();
})

vk.updates.on('wall_post_new', async (context: Context, next: any) => { 
	if (Math.abs(context.wall.authorId) == group_id && context.wall.createdUserId == root[0]) {
		for (const user of await prisma.user.findMany({ where: { status: { not: "banned" } } }) ) {
			await Sleep(await Rand_Int(15000))
			try {
				await vk.api.messages.send({ peer_id: user.idvk, random_id: 0, message: "⚙ Уведомление", attachment: context.wall })
			}
			catch (e) {
				console.log(`User ${user.idvk} blocked send message in chat`)
			}
		}
	}
	return await next();
})
vk.updates.on('message_event', async (context: Context, next: any) => {
	const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
	if (user.status == "banned") { return await next() }
	//await Sleep(4000)
	console.log(`${context.eventPayload.command} > ${JSON.stringify(context.eventPayload)}`)
	const config: any = {
		"main_menu": Main_Menu,
		"main_menu_close": Main_Menu_Close,
		"main_menu_corporation": Main_Menu_Corporation,
		"builder_control": Builder_Control,
		"builder_controller": Builder_Controller,
		"corporation_controller": Corporation_Controller,
		"builder_control_corporation": Builder_Control_Corporation,
		"builder_controller_corporation": Builder_Controller_Corporation,
		"planet_control": Planet_Control,
		"planet_controller": Planet_Controller,
		"member_control": Member_Control,
		"member_controller": Member_Controller,
		"worker_control": Worker_Control,
		"worker_controller": Worker_Controller,
		"research_control": Research_Control,
		"research_controller": Research_Controller
	}
	try {
		await config[context.eventPayload.command](context, user)
		let trigger: Trigger | null = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'antiflud' } })
		if (!trigger) { 
			trigger = await prisma.trigger.create({ data: { id_user: user.id, name: 'antiflud', value: false } })
			console.log(`Init antiflud for user ${context.peerId}`)
		}
		const datenow: Date = new Date()
		const dateold: Date = new Date(trigger!.update)
		if (user.limiter >= 70 && (Number(datenow) - Number(dateold)) < 600000 ) {
			await prisma.user.update({ where: { id: user.id }, data: { limiter: 0 } })
			await prisma.trigger.update({ where: { id: trigger.id }, data: { update: datenow } })
			await Send_Message(user.idvk, '☠ Ваш рабочий день закончен! Приходите через 10 минут, мы вам сообщим о новом рабочем дне!')
			/*await vk.api.messages.sendMessageEventAnswer({
				event_id: context.eventId,
				user_id: context.userId,
				peer_id: context.peerId,
				event_data: JSON.stringify({
					type: "show_snackbar",
					text: `☠ Ваш рабочий день закончен! Приходите через 5-10 минут, мы вам сообщим о новом рабочем дне!`
				})
			})*/
			await Sleep(600000)
			await Send_Message(user.idvk, '✅ Начался новый рабочий день, приступайте к работе!')
			return await next()
		} else {
			await prisma.user.update({ where: { id: user.id }, data: { limiter: { increment: 1 } } })
		}
		if ((Number(datenow) - Number(dateold)) > 600000) {
			await prisma.user.update({ where: { id: user.id }, data: { limiter: 0 } })
			await prisma.trigger.update({ where: { id: trigger.id }, data: { update: datenow } })
			/*await vk.api.messages.sendMessageEventAnswer({
				event_id: context.eventId,
				user_id: context.userId,
				peer_id: context.peerId,
				event_data: JSON.stringify({
					type: "show_snackbar",
					text: `✅ Начался новый рабочий день, приступайте к работе!`
				})
			})*/
			return await next()
		}
	} catch (e) {
		console.log(`Ошибка события ${e}`)
	}
	return await next();
})

vk.updates.start().then(() => {
	console.log('Servers game industrial edition ready for services clients!')
}).catch(console.error);