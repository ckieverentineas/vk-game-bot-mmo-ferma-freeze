import { User } from "@prisma/client"
import { Context, KeyboardBuilder } from "vk-io"
import { vk } from "../../..";
import prisma from "../../prisma";

export async function Member_Control(context: Context, user: User) {
    const keyboard = new KeyboardBuilder()
    const member_list: any = await prisma.user.findMany({ where: { id_corporation: user.id_corporation }, include: { Bulder: true } })
    let event_logger = `❄ Отдел управления сотрудниками:\n\n`
    let cur = context.eventPayload.office_current ?? 0
    const member = member_list[cur]
    const corp = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    const leader = await prisma.user.findFirst({ where: { id: corp?.id_user || 1 }})
    if (member_list.length > 0) {
        if (user.idvk == leader?.idvk) {
            keyboard.callbackButton({ label: '💥 Уволить', payload: { command: 'member_controller', command_sub: 'member_destroy', office_current: cur, target: member.id }, color: 'secondary' }).row()
        }
        //.callbackButton({ label: '👀', payload: { command: 'worker_controller', command_sub: 'worker_open', office_current: i, target: worker.id }, color: 'secondary' }).row()
        event_logger += `💬 Сотрудник, ${member.name}:\n💳 UID: ${member.id}\n🎥 Кремлевский номер: ${member.idvk}\n📈 Уровень: ${member.lvl}\n📗 Опыт: ${member.xp.toFixed(2)}\n💰 Шекели: ${member.gold.toFixed(2)}\n⚡ Энергия: ${member.energy.toFixed(2)}\n\n`;
        for (const i in member.Bulder) {
            event_logger += `🏛 ${member.Bulder[i].name} 📈 Уровень: ${member.Bulder[i].lvl}\n`
        }
    } else {
        event_logger = `💬 Вы еще не наняли рабочих, как насчет кого-то нанять?`
    }
    //предыдущий офис
    if (member_list.length > 1 && cur > 0) {
        keyboard.callbackButton({ label: '←', payload: { command: 'member_control', office_current: cur-1, target: member.id }, color: 'secondary' })
    }
    //следующий офис
    if (member_list.length > 1 && cur < member_list.length-1) {
        keyboard.callbackButton({ label: '→', payload: { command: 'member_control', office_current: cur+1, target: member.id }, color: 'secondary' })
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu_corporation' }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}

export async function Member_Controller(context: Context, user: User) {
    const target = context.eventPayload.target ?? 0
    const config: Office_Controller = {
        'member_destroy': Member_Destroy,
    }
    await config[context.eventPayload.command_sub](context, user, target)
}

type Office_Controller = {
    [key: string]: (context: Context, user: User, target: number) => Promise<void>;
}

async function Member_Destroy(context: Context, user: User, target: number) {
    const keyboard = new KeyboardBuilder()
    const member: User | null = await prisma.user.findFirst({ where: { id: target }})
    let event_logger = `В данный момент нельзя уволить сотрудников...`
    if (member) {
        if (context.eventPayload.status == "ok") {
            await prisma.$transaction([
                prisma.user.update({ where: { id: member.id }, data: { id_corporation: 0 } })
            ]).then(([builder_del]) => {
                event_logger = `⌛ Поздравляем с исключением из корпорации успешного сотрудника ${builder_del.name}-${builder_del.id}.\n` 
                console.log(`⌛ Поздравляем с исключением из корпорации успешного сотрудника ${builder_del.name}-${builder_del.id}.\n`);
                vk.api.messages.send({ peer_id: builder_del.idvk, random_id: 0, message: `Вас исключил из корпорации основатель корпорации ${user.name}!` })
            })
            .catch((error) => {
                event_logger = `⌛ Произошла ошибка исключения сотрудника, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        } else {
            event_logger = `Вы уверены, что хотите исключить из корпорации ${member.name}-${member.id}?`
            keyboard.callbackButton({ label: 'Хочу', payload: { command: 'member_controller', command_sub: 'member_destroy', office_current: 0, target: member.id, status: "ok" }, color: 'secondary' })
        } 
    }
    //назад хз куда
    keyboard.callbackButton({ label: '❌', payload: { command: 'main_menu', office_current: 0, target: undefined }, color: 'secondary' }).inline().oneTime() 
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${event_logger}`, keyboard: keyboard/*, attachment: attached.toString()*/ })
}