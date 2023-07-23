import { User, Builder, Trigger } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

export async function Income_Control(context: Context, user: User) {
    const builders: Builder[] | null = await prisma.builder.findMany({ where: { id_user: user.id } })
    const keyboard = new KeyboardBuilder()
    const datenow: Date = new Date()
    let event_logger = `Ничего не добывается`
    const trigger: Trigger | null = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'income' } })
    if (!trigger) { 
        await prisma.trigger.create({ data: { id_user: user.id, name: 'income', value: false } })
        console.log(`Init income for user ${context.peerId}`)
        event_logger = `Бизнес запущен, проверьте, есть ли у вас постройки и рабочие на них!`
    }
    if (trigger) {
        let income = 0
        for (const builder of builders) {
            let income_find = builder.income
            for (const worker of await prisma.worker.findMany({ where: { id_builder: builder.id } })) {
                income_find += worker.income
                income_find *= worker.speed
            }
            income += income_find
        }
        const dateold: Date = new Date(trigger.update)
        const koef: number = (Number(datenow) - Number(dateold))/3600000
        await prisma.$transaction([
            prisma.trigger.update({ where: { id: trigger.id }, data: { update: datenow } }),
            prisma.user.update({ where: { id: user.id }, data: { energy: { increment: income*koef } } })
        ]).then(([, user_income]) => {
            event_logger = `⌛ Работники предоставили отчет:\n🏦 За прошедшее время прошло ${koef.toFixed(2)} часов, прибыль составила ${(income*koef).toFixed(2)}⚡\n На вашем счете было ${user.energy.toFixed(2)}, новый баланс: ${user_income.energy.toFixed(2)}` 
            console.log(`⌛ Работники ${user.idvk} предоставили отчет:\n🏦 За прошедшее время прошло ${koef.toFixed(2)} часов, прибыль составила ${(income*koef).toFixed(2)}\n На вашем счете было ${user.energy.toFixed(2)}, новый баланс: ${user_income.energy.toFixed(2)}`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка предоставления отчета о прибыли, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    const trigger_worker: Trigger | null = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'worker' } })
    if (!trigger_worker) { 
        await prisma.trigger.create({ data: { id_user: user.id, name: 'worker', value: false } })
        console.log(`Init worker for user ${context.peerId}`)
    }
    const timer_week = 1000000000
    const koef_week = Number(datenow) - Number(trigger_worker?.update)
    if (trigger_worker && koef_week >= timer_week ) {
        await prisma.$transaction([
            prisma.trigger.update({ where: { id: trigger_worker.id }, data: { update: datenow } }),
            prisma.worker.updateMany({ where: { id_user: user.id }, data: { point: { increment: Math.floor(koef_week/timer_week) } } })
        ]).then(() => {
            event_logger += `⌛ Работники получили повышение:\n🏦 За прошедшее время прошло ${(koef_week/timer_week).toFixed(2)} недель, все работники получили по ${Math.floor(koef_week/timer_week)} очков обучения` 
            console.log(`⌛ Работники ${user.idvk} получили повышение:\n🏦 За прошедшее время прошло ${(koef_week/timer_week).toFixed(2)} недель, все работники получили по ${Math.floor(koef_week/timer_week)} очков обучения`);
        })
        .catch((error) => {
            event_logger += `⌛ Произошла ошибка прокачки рабочих, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    keyboard.callbackButton({ label: 'ОК', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Exchange_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    let event_logger = 'Для обмена энергии на шекели нужно минимум 10 энергии'
    if (user.energy >= 10) {
        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: user.energy }, gold: { increment: user.energy/10 } } })
        ]).then(([user_up]) => {
            event_logger = `⌛ На бирже вы обменяли ${user.energy.toFixed(2)}⚡ на ${(user.energy/10).toFixed(2)} шекелей\n На вашем счете было ${user.gold.toFixed(2)}, новый баланс: ${user_up.gold.toFixed(2)}` 
            console.log(`⌛ На бирже ${user.idvk} обменял ${user.energy.toFixed(2)}⚡ на ${(user.gold/10).toFixed(2)} шекелей\n На вашем счете было ${user.gold.toFixed(2)}, новый баланс: ${user_up.gold.toFixed(2)}`);
        })
        .catch((error) => {
            event_logger = `⌛ Произошла ошибка конвертации энергии в шекели, попробуйте позже` 
            console.error(`Ошибка: ${error.message}`);
        });
    }
    keyboard.callbackButton({ label: 'ОК', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}