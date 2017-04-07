const TelegramBot = require('node-telegram-bot-api');
const Packt = require('node-packtpub-download');
const schedule = require('node-schedule');
const time = require('time');
const R = require('ramda');
const jsonfile = require('jsonfile');
const winston = require('winston');
const Entities = require('html-entities').AllHtmlEntities;

// We need to modify the Date object because the node-schedule datetime is based on server time.
time.tzset('Asia/Jakarta');
Date = time.Date; // eslint-disable-line

const token = process.env.TELEGRAM_BOT_TOKEN;

const entities = new Entities();
const packtClient = new Packt.Client();
const bot = new TelegramBot(token, { polling: true });
const job = new schedule.RecurrenceRule();
const consoleTransport = new winston.transports.Console({
  level: 'info',
  timestamp: () => new Date().toString(),
  colorize: true,
});

const logger = new winston.Logger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  transports: [consoleTransport],
});

job.hour = 15;
job.minute = 0;
job.second = 0;

const constructMessage = (book) => {
  const title = `<b>${entities.decode(book.bookTitle)}</b>`;
  const summary = entities.decode(book.bookSummary);

  return 'Today\'s Packtpub Free Learning Book: \n' + title + '\n\n' + summary; // eslint-disable-line
};

const encodeImageUrl = imageUrl => imageUrl.replace(/\s/g, '%20');

bot.onText(/\/start/, (msg) => {
  logger.info('Incoming /start command', msg);

  const isGroup = R.pathEq(['chat', 'type'], 'group');
  const groupHandler = body => ({
    id: body.chat.id,
    name: body.chat.title,
  });
  const groupData = R.cond([
    [body => R.equals(isGroup(body), true), groupHandler],
    [R.T, body => false],
  ])(msg);

  jsonfile.readFile('./groups.json', (err, obj) => {
    if (err) throw err;

    const groups = obj; // This will always be an array
    const dataIsExists = json => json.some(x => x.id === groupData.id);

    // Will add new group data to the json
    // if the group id is not exists
    if (groupData && !dataIsExists(groups)) {
      groups.push(groupData);
      jsonfile.writeFileSync('./groups.json', groups);
      bot.sendMessage(groupData.id, 'Hello, I will show you Packtpub free ebook once a day :)');
    }
  });
});

bot.onText(/\/end/, (msg) => {
  logger.info('Incoming /end command', msg);

  jsonfile.readFile('./groups.json', (err, groupData) => {
    if (err) throw err;

    const updateGroup = groupData.filter(data => data.id !== msg.chat.id);

    bot
      .sendMessage(msg.chat.id, 'Thank you :)')
      .then(() => {
        bot.leaveChat(msg.chat.id);
      })
      .then(() => {
        jsonfile.writeFileSync('./groups.json', updateGroup);
      });
  });
});

schedule.scheduleJob(job, () => {
  logger.info('worker started');

  jsonfile.readFile('./groups.json', (err, groups) => {
    groups.forEach((group) => {
      packtClient.fetchDealOfTheDay()
        .then((book) => {
          bot
            .sendMessage(group.id, constructMessage(book), {
              parse_mode: 'HTML',
            })
            .then(() => {
              bot.sendPhoto(group.id, encodeImageUrl(book.bookImage));
            });
        });
    });
  });
});

logger.info('token', token);
logger.info('Server is up!');
