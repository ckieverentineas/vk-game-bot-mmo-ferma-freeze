import { User } from "@prisma/client";
import { answerTimeLimit, chat_id, timer_text, vk } from "../../../";
import prisma from "../../prisma";
import { Context, Keyboard } from "vk-io";
import { User_Menu_Show } from "./control";

export async function User_Register(context: Context) {
    //согласие на обработку
	const answer = await context.question(`⌛ Как только вы открыли дверь офиса 🏦, из ниоткуда перед вами предстали двое в черных очках и надменно сказали: \n — Ваш отец скончался и мы его замесили, а вы здесь впервые. Прежде чем управлять, распишитесь здесь о своем согласии на обработку персональных данных. \n В тот же миг в их руках магическим образом появился пергамент и автоматы АК-47. \n 💡 Предупреждение, любые вопросы в нашем офисе ограничены 5 минутами на ваши ответы в процессе обслуживания!`,
        {	
            keyboard: Keyboard.builder()
            .textButton({ label: '✏', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: '👣', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime(),
            answerTimeLimit
        }
    );
    if (answer.isTimeout) { return await context.send(`⏰ Время ожидания подтверждения согласия истекло, вас тоже замесили!`) }
    if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
        await context.send('⌛ Вы отказались дать свое согласие, а живым отсюда никто не уходил, вас упаковали!');
        return;
    }
    //приветствие игрока
    const visit = await context.question(`⌛ Поставив свою подпись, вы, стараясь не смотреть косо на крутых типов в черных очках, сели в свое новое кресло босса, запустили компьютер в корпоративном домене.`,
        { 	
            keyboard: Keyboard.builder()
            .textButton({ label: 'Открыть саперы', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: 'Посмотреть в окно', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
            answerTimeLimit
        }
    );
    if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
    let name = null
    while (!name) {
        const name_in = await context.question( `🧷 Через некоторое время вы авторизовались под своей учеткй🏦! Судя по всему, вы здесь впервые. Назовите ваше имя и фамилию. \n ❗ Внимание! Предоставление заведомо ложных данных преследуются законом!`, timer_text)
        if (name_in.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени истекло!`) }
        if (name_in.text.length <= 64) {
            name = name_in.text
            if (name_in.text.length > 32) { await context.send(`⚠ Ваши ФИО не влезают на стандартный бланк (32 символа)! Система может использовать бланк повышенной ширины, но нужно доплатить 1₪ за каждый не поместившийся символ.`) }
        } else { await context.send(`⛔ Ваши ФИО не влезают на бланк повышенной ширины (64 символа), и вообще, запрещены юридическим законодательством! Выплатите штраф в 30₪ или люди в черном сейчас вас замесят.`) }
    }
    const save: User = await prisma.user.create({	data: {	idvk: context.senderId, name } })
    if (save) {
        await context.send(`⌛ Успешный запуск корпорации зла под эгидой ${save.name}. \n ⚖Вам открыт счет индивидуального предпринимателя под UID: ${save.id}. \n 🏦Вам зачислено ${save.gold} шекелей`)
        console.log(`Success save user idvk: ${context.senderId}`)
    }
    await context.send(`💡 Когда клавиатуры нет, напишите команду [клава] без квадратных скобочек`)
    await context.send(`✅ 💡 Для корректной игры требуется официально приложение ВК, или с компьютера.\nВ главном меню есть четыре кнопки:\n\n~ Здания - меню для управления постройками;\n~ Люди - меню для управления рабочими;\n~ Прибыль - кнопка для запуска бизнеса и сбор прибыли после назначения рабочих на постройки и постройки зданий;\n~ Биржа - кнопка для обмена 2 единиц энергии на 1 шекель (денежная валюта используемая в игре);\n~➕ - кнопка для постройки здания/найма рабочего;\n~ Улучшить/Обучить - кнопка для прокачки здания/персонажа;\n~ Разрушить/Уволить - кнопка для уничтожения здания/увольнения рабочего;\n~ Работа - кнопка для назначения рабочему его места работы в построенном здании.\n\nТакже за лайки постов вы можете получить 100 шекелей\n\nТакже доступна команда [помощь] показывающая список актуальных доступных команд.`)
    await vk.api.messages.send({
        peer_id: chat_id,
        random_id: 0,
        message: `⁉@id${save.idvk}(${save.name}) открывает свой бизнес по контракту UID: ${save.id}!`
    })
    await User_Menu_Show(context, save)
}