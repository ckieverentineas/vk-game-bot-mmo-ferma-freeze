import { User, Builder, Trigger } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

export async function Income_Control(context: Context, user: User) {
    const builders: Builder[] | null = await prisma.builder.findMany({ where: { id_user: user.id } })
    const keyboard = new KeyboardBuilder()
    const trigger: Trigger | null = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'income' } })
    let event_logger = `Ничего не добывается`
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
        const datenow: Date = new Date()
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
    
    keyboard.callbackButton({ label: 'ОК', payload: { command: 'main_menu' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}