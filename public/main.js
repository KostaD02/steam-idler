const navbarItems = document.getElementById('navbar-items');
const hero = document.getElementById('hero');
const afterUserAction = document.querySelectorAll('.hide-before-user-action');
const usersContainer = document.getElementById('users');

const BASE_URL = 'http://localhost:2222/api';
const httpService = new HttpService(BASE_URL);

main();

async function main() {
  await initUsers();
}

async function initUsers() {
  const users = await httpService.get('users');
  if (users.length === 0) {
    return;
  }
  initUserUI(users);
}

function initUserUI(users) {
  hero.remove();
  afterUserAction.forEach((section) => {
    section.classList.remove('hide-before-user-action');
  });
  while (usersContainer.firstChild) {
    usersContainer.removeChild(usersContainer.firstChild);
  }
  users.forEach((user) => {
    const userCard = createUserCard(user);
    usersContainer.appendChild(userCard);
  });
}

function createUserCard(user) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.style.maxWidth = '500px';

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  cardBody.innerHTML = `<h5 class="card-title">${user.name}</h5>`;

  const userInfoList = createUserInfoList(user);
  cardBody.appendChild(userInfoList);

  const actionButtons = createActionButtons(user, userInfoList);
  cardBody.appendChild(actionButtons);

  card.appendChild(cardBody);
  return card;
}

function createUserInfoList(user) {
  const cardList = document.createElement('ul');
  cardList.classList.add('list-group', 'list-group-flush');

  const userInfoItems = [
    {
      key: 'idle',
      label: 'Is idle',
      value: user.idleGames,
      type: 'badge',
      badgeClass: user.idleGames ? 'success' : 'warning',
    },
    {
      key: 'personaState',
      label: 'Persona state',
      value: user.personaState,
      type: 'text',
    },
    {
      key: 'gameIds',
      label: 'Game ids',
      value: user.gameIds.join(', '),
      type: 'text',
    },
    {
      key: 'gameExtraInfo',
      label: 'Game extra info',
      value: user.gameExtraInfo,
      type: 'text',
    },
    {
      key: 'replyMessageWhileIdle',
      label: 'Reply message while idle',
      value: user.replyMessageWhileIdle,
      type: 'badge',
      badgeClass: user.replyMessageWhileIdle ? 'success' : 'warning',
    },
    {
      key: 'replyMessageTemplate',
      label: 'Reply message template',
      value: user.replyMessageTemplate,
      type: 'text',
    },
  ];

  userInfoItems.forEach((item) => {
    const listItem = createUserInfoListItem(item);
    listItem.dataset.key = item.key;
    cardList.appendChild(listItem);
  });

  return cardList;
}

function createUserInfoListItem(item) {
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item');

  if (item.type === 'badge') {
    listItem.innerHTML = `${item.label}: <span class="badge bg-${item.badgeClass}">${item.value}</span>`;
  } else {
    listItem.textContent = `${item.label}: ${item.value}`;
  }

  return listItem;
}

function createActionButtons(user, userInfoList) {
  const cardActions = document.createElement('div');
  cardActions.classList.add(
    'card-actions',
    'mt-3',
    'd-flex',
    'gap-2',
    'flex-wrap',
  );

  const buttonConfigs = [
    {
      key: 'toggleIdle',
      text: user.idleGames ? 'Stop Idle' : 'Start Idle',
      className: user.idleGames ? 'btn-danger' : 'btn-success',
      handler: () =>
        toggleIdle(
          user,
          cardActions.querySelector('[data-key="toggleIdle"]'),
          userInfoList.querySelector('[data-key="idle"]'),
        ),
    },
    {
      key: 'changePersona',
      text: 'Change Persona',
      className: 'btn-primary',
      handler: () =>
        changePersona(
          user,
          cardActions.querySelector('[data-key="changePersona"]'),
          userInfoList.querySelector('[data-key="personaState"]'),
        ),
    },
    {
      key: 'changeGameIds',
      text: 'Change Game Ids',
      className: 'btn-primary',
      handler: () =>
        changeGameIds(
          user,
          cardActions.querySelector('[data-key="changeGameIds"]'),
          userInfoList.querySelector('[data-key="gameIds"]'),
        ),
    },
    {
      key: 'changeGameExtraInfo',
      text: 'Change Game Extra Info',
      className: 'btn-primary',
      handler: () =>
        changeGameExtraInfo(
          user,
          cardActions.querySelector('[data-key="changeGameExtraInfo"]'),
          userInfoList.querySelector('[data-key="gameExtraInfo"]'),
        ),
    },
    {
      key: 'toggleReplyMessageWhileIdle',
      text: user.replyMessageWhileIdle
        ? 'Stop Reply Message While Idle'
        : 'Start Reply Message While Idle',
      className: user.replyMessageWhileIdle ? 'btn-danger' : 'btn-success',
      handler: () =>
        toggleReplyMessageWhileIdle(
          user,
          cardActions.querySelector('[data-key="toggleReplyMessageWhileIdle"]'),
          userInfoList.querySelector('[data-key="replyMessageWhileIdle"]'),
        ),
    },
    {
      key: 'changeReplyMessageTemplate',
      text: 'Change Reply Message Template',
      className: 'btn-primary',
      handler: () =>
        changeReplyMessageTemplate(
          user,
          cardActions.querySelector('[data-key="changeReplyMessageTemplate"]'),
          userInfoList.querySelector('[data-key="replyMessageTemplate"]'),
        ),
    },
    {
      key: 'clearReplyMessageTemplate',
      text: 'Clear Reply Message Template',
      className: 'btn-warning',
      handler: () =>
        clearReplyMessageTemplate(
          user,
          cardActions.querySelector('[data-key="clearReplyMessageTemplate"]'),
          userInfoList.querySelector('[data-key="replyMessageTemplate"]'),
        ),
    },
    {
      key: 'signOut',
      text: 'Sign Out',
      className: 'btn-danger',
      handler: () => signOut(user),
    },
  ];

  buttonConfigs.forEach((config) => {
    const button = createActionButton(config);
    cardActions.appendChild(button);
  });

  return cardActions;
}

function createActionButton(config) {
  const button = document.createElement('button');
  button.classList.add('btn', config.className);
  button.textContent = config.text;
  button.dataset.key = config.key;
  button.addEventListener('click', config.handler);
  return button;
}

function toggleIdle(user, btn, listItem) {
  const endpoint = `idle/${user.idleGames ? 'stop' : 'start'}`;
  httpService
    .patch(endpoint, { name: user.name })
    .then((response) => {
      if (response.success) {
        user.idleGames = !user.idleGames;
        btn.textContent = user.idleGames ? 'Stop Idle' : 'Start Idle';
        btn.classList.toggle('btn-danger', user.idleGames);
        btn.classList.toggle('btn-success', !user.idleGames);
        listItem.innerHTML = `Is idle: <span class="badge bg-${
          user.idleGames ? 'success' : 'warning'
        }">${user.idleGames}</span>`;
      }
    })
    .catch(handleErrorPopUp);
}

async function changePersona(user, btn, listItem) {
  const result = await createDynamicPopUpForm(
    'text',
    'Enter new persona',
    'Change Persona',
    'Enter new persona (0-7) <br /> 0 is Offline | 1 is Online | 2 is Busy | 3 is Away | 4 is Snooze | 5 is LookingToTrade | 6 is LookingToPlay | 7 is Invisible',
  );
  if (!result) {
    return;
  }
  if (result < 0 || result > 7) {
    await handleErrorPopUp({
      error: 'Invalid persona state',
      errorKeys: ['error.invalid_persona_state'],
    });
    return;
  }
  const endpoint = `persona/state`;
  httpService
    .patch(endpoint, { name: user.name, personaState: result })
    .then((response) => {
      if (response.success) {
        user.personaState = result;
        listItem.textContent = `Persona state: ${result}`;
      }
    })
    .catch(handleErrorPopUp);
}

async function changeGameIds(user, btn, listItem) {
  const result = await createDynamicPopUpForm(
    'text',
    'For example: 1245620 2622380',
    'Change Game Ids',
    'Enter new game ids (separated by space). Find game ids at <a href="https://steamdb.info" target="_blank">steamdb.info</a>',
  );
  if (!result) {
    return;
  }
  const gameIds = result.split(' ').reduce((acc, id) => {
    if (Number(id)) {
      acc.push(Number(id));
    }
    return acc;
  }, []);
  if (gameIds.length === 0) {
    await handleErrorPopUp({
      error: 'Invalid game ids, please enter only numbers with space separator',
      errorKeys: ['error.invalid_game_ids'],
    });
    return;
  }
  const endpoint = `idle/games-to-idle`;
  httpService
    .patch(endpoint, { name: user.name, gameIds })
    .then((response) => {
      if (response.success) {
        user.gameIds = gameIds;
        listItem.textContent = `Game ids: ${gameIds.join(', ')}`;
      }
    })
    .catch(handleErrorPopUp);
}

async function changeGameExtraInfo(user, btn, listItem) {
  const result = await createDynamicPopUpForm(
    'text',
    'Enter new game extra info',
    'Change Game Extra Info',
  );
  if (!result) {
    return;
  }
  const endpoint = `idle/custom-game-name-display`;
  httpService
    .patch(endpoint, { name: user.name, gameExtraInfo: result })
    .then((response) => {
      if (response.success) {
        user.gameExtraInfo = result;
        listItem.textContent = `Game extra info: ${result}`;
      }
    })
    .catch(handleErrorPopUp);
}

async function toggleReplyMessageWhileIdle(user, btn, listItem) {
  const result = !user.replyMessageWhileIdle;
  const endpoint = `idle/message/reply/${result ? 'start' : 'stop'}`;
  httpService
    .patch(endpoint, { name: user.name })
    .then((response) => {
      if (response.success) {
        user.replyMessageWhileIdle = result;
        listItem.innerHTML = `Reply message while idle: <span class="badge bg-${
          result ? 'success' : 'warning'
        }">${result}</span>`;
        btn.textContent = result
          ? 'Stop Reply Message While Idle'
          : 'Start Reply Message While Idle';
        btn.classList.toggle('btn-success', !result);
        btn.classList.toggle('btn-danger', result);
      }
    })
    .catch(handleErrorPopUp);
}

async function changeReplyMessageTemplate(user, btn, listItem) {
  const result = await createDynamicPopUpForm(
    'text',
    'Enter new reply message template',
    'Change Reply Message Template',
  );
  if (!result) {
    return;
  }
  const endpoint = `idle/message/reply/template-set`;
  httpService
    .patch(endpoint, { name: user.name, message: result })
    .then((response) => {
      if (response.success) {
        user.replyMessageTemplate = result;
        listItem.textContent = `Reply message template: ${result}`;
      }
    })
    .catch(handleErrorPopUp);
}

async function clearReplyMessageTemplate(user, btn, listItem) {
  const result = await createDynamicPopUpConfirmation(
    'Clear Reply Message Template',
    'Are you sure you want to clear reply message template? <br /> This will clear the reply message template for this user.',
    'Yes',
    'No',
  );
  if (!result) {
    return;
  }
  const endpoint = `idle/message/reply/template-clear`;
  httpService
    .delete(endpoint, { name: user.name })
    .then((response) => {
      if (response.success) {
        user.replyMessageTemplate = null;
        listItem.textContent = `Reply message template:`;
      }
    })
    .catch(handleErrorPopUp);
}

async function signOut(user) {
  const result = await createDynamicPopUpConfirmation(
    'Sign Out',
    'Are you sure you want to sign out? <br /> This will sign out the user from the server.',
    'Yes',
    'No',
  );
  if (!result) {
    return;
  }
  const endpoint = `auth/sign-out`;
  httpService
    .delete(endpoint, { name: user.name })
    .then((response) => {
      if (response.success) {
        initUsers();
      }
    })
    .catch(handleErrorPopUp);
}
