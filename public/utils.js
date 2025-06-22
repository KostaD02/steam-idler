class HttpService {
  baseUrl = '';

  constructor(baseUrl = location.origin + '/api') {
    this.baseUrl = baseUrl;
  }

  get currentTime() {
    return new Date().toLocaleString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  get(url) {
    return this.httpRequest(url, 'GET');
  }

  post(url, body) {
    return this.httpRequest(url, 'POST', body);
  }

  patch(url, body) {
    return this.httpRequest(url, 'PATCH', body);
  }

  delete(url, body) {
    return this.httpRequest(url, 'DELETE', body);
  }

  httpRequest(url, method, body) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${BASE_URL}/${url}`);
    if (body) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
    }
    xhr.onloadstart = () => {
      console.log(
        `[${this.currentTime}] Start request to `,
        `${BASE_URL}/${url}`,
      );
    };
    xhr.send(JSON.stringify(body));
    return new Promise((resolve, reject) => {
      xhr.onloadend = () => {
        console.log(
          `[${this.currentTime}] End request to `,
          `${BASE_URL}/${url}`,
          `with status ${xhr.status}`,
        );
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject(JSON.parse(xhr.response));
        }
      };
    });
  }
}

function createDynamicPopUpForm(
  type = 'text',
  placeholder = 'Simple placeholder',
  title = 'Enter Information',
  description = null,
) {
  return new Promise((resolve) => {
    const modalId = `dynamicModal_${Date.now()}`;
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="${modalId}Label">${title}</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="${modalId}Form">
                <div class="mb-3">
                  <input type="${type}" class="form-control" id="${modalId}Input" placeholder="${placeholder}" required>
                  ${description ? `<div class="form-text">${description}</div>` : ''}
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" form="${modalId}Form" class="btn btn-primary">Submit</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById(modalId);
    const formElement = document.getElementById(`${modalId}Form`);
    const inputElement = document.getElementById(`${modalId}Input`);

    const modal = new bootstrap.Modal(modalElement);
    let isResolved = false;

    modalElement.addEventListener('hide.bs.modal', () => {
      document.activeElement.blur();
    });

    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = inputElement.value.trim();

      if (value) {
        isResolved = true;
        document.activeElement.blur();
        modal.hide();
        resolve(value);
      }
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();

      if (!isResolved) {
        resolve(null);
      }
    });

    modalElement.addEventListener('shown.bs.modal', () => {
      inputElement.focus();
      document.activeElement.blur();
    });

    modal.show();
  });
}

function createDynamicPopUpConfirmation(
  title = 'Confirmation',
  description = 'This is a confirmation popup.',
  buttonOkayText = 'Confirm',
  buttonCancelText = 'Cancel',
) {
  return new Promise((resolve) => {
    const modalId = `dynamicConfirmation_${Date.now()}`;
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="${modalId}Label">${title}</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">${description}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="${modalId}Cancel">${buttonCancelText}</button>
              <button type="button" class="btn btn-primary" id="${modalId}Confirm">${buttonOkayText}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById(modalId);
    const confirmButton = document.getElementById(`${modalId}Confirm`);
    const cancelButton = document.getElementById(`${modalId}Cancel`);

    const modal = new bootstrap.Modal(modalElement);
    let isResolved = false;

    modalElement.addEventListener('hide.bs.modal', () => {
      document.activeElement.blur();
    });

    confirmButton.addEventListener('click', () => {
      isResolved = true;
      document.activeElement.blur();
      modal.hide();
      resolve(true);
    });

    cancelButton.addEventListener('click', () => {
      isResolved = true;
      document.activeElement.blur();
      modal.hide();
      resolve(false);
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();

      if (!isResolved) {
        resolve(false);
      }
    });

    modal.show();
  });
}

function createDynamicPopUp(
  title = 'Information',
  description = 'This is an information popup.',
  buttonText = 'OK',
) {
  return new Promise((resolve) => {
    const modalId = `dynamicPopUp_${Date.now()}`;
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="${modalId}Label">${title}</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">${description}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">${buttonText}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalElement);

    modalElement.addEventListener('hide.bs.modal', () => {
      document.activeElement.blur();
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      resolve(true);
    });

    modal.show();
  });
}

async function handleErrorPopUp(err) {
  let message = err.error;
  let keys = err.errorKeys;

  if (typeof err.errorKeys === 'object') {
    keys = err.errorKeys.join(', ');
  }

  await createDynamicPopUp(
    `Error ${err.statusCode || ''}`,
    `${message} (${keys})`,
  );
}

function setTheme(mode = 'auto') {
  const userMode = localStorage.getItem('bs-theme');
  const sysMode = window.matchMedia('(prefers-color-scheme: light)').matches;
  const useSystem = mode === 'system' || (!userMode && mode === 'auto');
  const modeChosen = useSystem
    ? 'system'
    : mode === 'dark' || mode === 'light'
      ? mode
      : userMode;

  if (useSystem) {
    localStorage.removeItem('bs-theme');
  } else {
    localStorage.setItem('bs-theme', modeChosen);
  }

  document.documentElement.setAttribute(
    'data-bs-theme',
    useSystem ? (sysMode ? 'light' : 'dark') : modeChosen,
  );
  document
    .querySelectorAll('.mode-switch .btn')
    .forEach((e) => e.classList.remove('text-body'));
  document.getElementById(modeChosen).classList.add('text-body');
}

setTheme();
document
  .querySelectorAll('.mode-switch .btn')
  .forEach((e) => e.addEventListener('click', () => setTheme(e.id)));
window
  .matchMedia('(prefers-color-scheme: light)')
  .addEventListener('change', () => setTheme());
