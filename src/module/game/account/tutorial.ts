import { User } from "@prisma/client";
import { answerTimeLimit, chat_id, timer_text } from "../../../";
import prisma from "../../prisma";
import { Context, Keyboard } from "vk-io";
import { User_Menu_Show } from "./control";
import { Send_Message_Universal } from "../../../module/fab/helper";

export async function User_Register(context: Context) {
    //согласие на обработку
	const answer = await context.question(`🕵️‍♂️ Как только ты ввалился в офис 🏦, перед тобой, как из ниоткуда, выскочили двое в черных очках и с ухмылками на лицах произнесли:\n\n— У нас плохие новости, малец: твой отец не с нами. Ты здесь впервые, так что сначала подпиши, что согласен на обработку своих данных.\n\nВ тот же миг в их руках блеснули пергамент и автоматы АК-47.\n\n💡 Учти, на любые вопросы у нас всего 5 минут, так что не трать время зря!`,
        {	
            keyboard: Keyboard.builder()
            .textButton({ label: '✏', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: '👣', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime(),
            answerTimeLimit
        }
    );
    if (answer.isTimeout) { return await context.send(`⏰ Время вышло, малец! Ты не успел подтвердить согласие, и теперь ты тоже в нашем списке. Пора прощаться!`); }
    if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
        await context.send('🚫 Ты отказался дать согласие, а знаешь, как у нас с этим обстоят дела? Живым отсюда никто не уходит — тебя упаковали, малец!');
        return;
    }
    //приветствие игрока
    const visit = await context.question(`⌛ Поставив свою подпись, ты старался не встречаться взглядами с крутыми парнями в черных очках. Сел в свое новое кресло босса и запустил компьютер в корпоративном домене, готовясь к тому, что ждет впереди.`,
        { 	
            keyboard: Keyboard.builder()
            .textButton({ label: 'Запустить атаку', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: 'Смотреть в бездну', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
            answerTimeLimit
        }
    );
    if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
    let name = null
    while (!name) {
        const name_in = await context.question( `🧷 Через некоторое время ты вкатился в систему под своей учеткой 🏦! Похоже, ты здесь новенький. Назови свой никнейм, малец.\n❗ Учти! Ложные данные — это серьезное дело, и за это могут настучать по шапке!`, timer_text)
        if (name_in.isTimeout) { return await context.send(`⏰ Время вышло, малец! Ты не успел ввести имя, и теперь у нас для тебя плохие новости!`) }
        if (name_in.text.length <= 64) {
            name = name_in.text
            if (name_in.text.length > 32) { await context.send(`⚠ Твои ФИО не влезают в бланк (32 символа)! Можем использовать расширенный бланк, но за каждый лишний символ придется отдать 1₪.`) }
        } else { await context.send(`⛔ Твои ФИО не влезают в расширенный бланк (64 символа), и вообще, это под запретом по закону! Выплати штраф в 30₪, или люди в черном быстро разберутся с тобой.`) }
    }
    const save: User = await prisma.user.create({	data: {	idvk: context.senderId, name } })
    if (save) {
        await context.send(`⌛ Корпорация зла ${save.name} успешно запущена. \n ⚖ У тебя теперь счет индивидуального предпринимателя с UID: ${save.id}. \n 🏦 На счет зачислено ${save.gold} шекелей. Готовься к делу!`);
        console.log(`Success save user idvk: ${context.senderId}`)
    }
    await context.send(`💡 Когда клавиатуры нет, напишите команду [клава] без квадратных скобочек`)
    await context.send(`✅ 💡 Для нормальной работы тебе нужно официальное приложение ВК или комп.\nА теперь иди в планеты колонизировать свою первую планету используй базовый билд:\n- Склад x1 (чтобы складировать ресурсы)\n- Шахта х1 (чтобы истощить гребанную планету под нолик)\n- Город х1 (чтобы обеспечить сотрудников жильем и автоматически ими управлять)\n- Центробанк х1 (чтобы добытое золото шахтами, чеканить в шекели)\n- Электростанция х1 (чтобы добытый уголь конвертировать в энергию для обеспечения питания)\n- Завод х1 (чтобы обрабатывать добытую руду шахтами в железные слитки)\n- Археологический центр х1 (чтобы добытые артефакты вскрывать для получения ресурсов и расширения площадок)\nНа старте дается лишь 7 площадок\n\nТакже доступна команда [!помощь], чтобы увидеть список актуальных команд.`);
    await Send_Message_Universal(chat_id, `⁉@id${save.idvk}(${save.name}) открывает свой бизнес по контракту UID: ${save.id}!`)
    await User_Menu_Show(context, save)
}