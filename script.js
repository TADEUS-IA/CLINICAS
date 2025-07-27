document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // MÓDULO DE CONFIGURAÇÃO: Seus dados estratégicos, intocados.
    // ===================================================================
    const CONFIG = {
        webhookURL: 'http://localhost:5678/webhook-test/capturadeclientes',
        finalVideoPath: 'video.mp4',
        backgroundMusicPath: 'musica.mp3',
        validationRegex: {
            name: /^[a-zA-ZáàãâéèêíìóòõôúùçÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙ\s'-]{3,}$/,
            phone: /^\(?(?:[1-9][0-9])\)?\s?9?\d{4,5}-?\d{4}$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        journey: [
            { type: 'multiple-choice', name: "etapa_1_engajamento", image: "imagem01.jpg", options: [ { text: "Perco clientes por demora", value: 2 }, { text: "Meu processo é manual", value: 1 }, { text: "Estou apenas curioso", value: 0 } ] },
            { type: 'text-input', name: 'nome', image: 'imagem02.jpg', question: 'Entendido. Para continuarmos, qual seu nome?', validation: 'name' },
            { type: 'text-input', name: 'email', image: 'imagem03.jpg', question: 'Obrigado. Agora, seu melhor e-mail.', validation: 'email' },
            { type: 'text-input', name: 'telefone', image: 'imagem04.jpg', question: 'Perfeito. E para finalizar, seu telefone.', validation: 'phone' },
            { type: 'multiple-choice', name: "etapa_2_solucao", image: "imagem05.jpg", options: [ { text: "Preciso automatizar agora", value: 2 }, { text: "Quero mais eficiência", value: 1 }, { text: "Tenho medo de robôs", value: 0 } ] },
            { type: 'multiple-choice', name: "etapa_3_disponibilidade", image: "imagem06.jpg", options: [ { text: "Quero atender 24/7", value: 2 }, { text: "Atendo em horário comercial", value: 1 }, { text: "Meu público é específico", value: 0 } ] },
            { type: 'multiple-choice', name: "etapa_4_investimento", image: "imagem07.jpg", options: [ { text: "Investir para escalar", value: 2 }, { text: "Busco custo-benefício", value: 1 }, { text: "Quero algo gratuito", value: 0 } ] },
            { type: 'multiple-choice', name: "etapa_5_implementacao", image: "imagem08.jpg", options: [ { text: "Quero começar hoje", value: 2 }, { text: "Preciso de ajuda para iniciar", value: 1 }, { text: "Parece complicado", value: 0 } ] },
            { type: 'multiple-choice', name: "etapa_6_concorrencia", image: "imagem09.jpg", options: [ { text: "Quero estar à frente", value: 2 }, { text: "Acompanho o mercado", value: 1 }, { text: "Não me comparo", value: 0 } ] },
            { type: 'multiple-choice', name: "etapa_7_decisao", image: "imagem10.jpg", options: [ { text: "Vamos iniciar a parceria", value: 2 }, { text: "Preciso de mais detalhes", value: 1 }, { text: "Vou pensar a respeito", value: 0 } ] }
        ]
    };

    // ===================================================================
    // MÓDULO DE UI: Referências para os elementos do DOM.
    // ===================================================================
    const UI = {
        appContainer: document.getElementById('app-container'),
        messageContainer: document.getElementById('message-container'),
        optionsContainer: document.getElementById('options-container'),
        inputForm: document.getElementById('input-form'),
        userInput: document.getElementById('user-input'),
        imageBg1: document.getElementById('image-bg-1'),
        imageBg2: document.getElementById('image-bg-2'),
        backgroundMusic: document.getElementById('background-music'),
        backBtn: document.getElementById('back-btn'),
        audioBtn: document.getElementById('audio-btn'),
        finalVideo: document.getElementById('final-video'),
        finalScreen: document.querySelector('.journey-app__final-screen'),
        unmuteVideoBtn: document.getElementById('unmute-video-btn'),
    };

    // ===================================================================
    // MÓDULO DE ESTADO: O "cérebro" da aplicação.
    // ===================================================================
    const STATE = {
        currentStepIndex: 0,
        userAnswers: {},
        isProcessing: false,
        activeImage: UI.imageBg1,
        inactiveImage: UI.imageBg2,
    };

    // ===================================================================
    // LÓGICA DA APLICAÇÃO
    // ===================================================================
    
    /**
     * Atualiza a imagem de fundo com efeito de cross-fade.
     */
    async function updateImage(newSrc) {
        if (!newSrc || STATE.activeImage.src.endsWith(newSrc)) return;

        return new Promise((resolve) => {
            STATE.inactiveImage.src = newSrc;
            const onImageLoad = () => {
                STATE.activeImage.classList.remove('is-active');
                STATE.inactiveImage.classList.add('is-active');
                [STATE.activeImage, STATE.inactiveImage] = [STATE.inactiveImage, STATE.activeImage]; // Troca as referências
                STATE.inactiveImage.removeEventListener('load', onImageLoad);
                resolve();
            };
            STATE.inactiveImage.addEventListener('load', onImageLoad);
            STATE.inactiveImage.onerror = () => {
                console.error(`Erro ao carregar imagem: ${newSrc}`);
                resolve(); // Continua mesmo com erro
            };
        });
    }

    /**
     * Renderiza a UI com base no estado atual da aplicação.
     * Esta é a única função que deve modificar o DOM diretamente.
     */
    async function render() {
        STATE.isProcessing = true;
        const step = CONFIG.journey[STATE.currentStepIndex];

        // Atualiza a imagem de fundo
        await updateImage(step.image);

        // Limpa os contêineres
        UI.messageContainer.innerHTML = '';
        UI.optionsContainer.innerHTML = '';

        // Atualiza a classe de estado do container principal
        UI.appContainer.className = 'journey-app is-visible'; // Reseta as classes
        if (step.type === 'multiple-choice') {
            UI.appContainer.classList.add('is-choice-step');
        } else if (step.type === 'text-input') {
            UI.appContainer.classList.add('is-input-step');
        }

        // Renderiza a mensagem do bot, se houver
        if (step.question) {
            const msgEl = document.createElement('div');
            msgEl.className = 'bot-message';
            msgEl.textContent = step.question;
            UI.messageContainer.appendChild(msgEl);
        }
        
        // Renderiza as opções ou o campo de input
        if (step.type === 'multiple-choice') {
            step.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'journey-app__button';
                button.textContent = option.text;
                button.style.animationDelay = `${index * 100}ms`;
                button.onclick = () => handleChoice(option, step.name);
                UI.optionsContainer.appendChild(button);
            });
        } else if (step.type === 'text-input') {
            UI.userInput.value = STATE.userAnswers[step.name] || '';
            UI.userInput.classList.remove('is-error');
        }

        // Controla a visibilidade dos botões de controle
        UI.backBtn.classList.toggle('is-visible', STATE.currentStepIndex > 0);
        UI.audioBtn.classList.toggle('is-visible', true);

        STATE.isProcessing = false;
    }

    /**
     * Navega para uma etapa específica, atualizando o estado e a URL.
     */
    function navigateToStep(index) {
        if (STATE.isProcessing || index < 0) return;
        
        // Final da jornada
        if (index >= CONFIG.journey.length) {
            finishJourney();
            history.pushState({ step: 'final' }, '', `#final`);
            return;
        }

        STATE.currentStepIndex = index;
        history.pushState({ step: index }, '', `#etapa=${index + 1}`);
        render();
    }

    /**
     * Manipula a escolha de uma opção de múltipla escolha.
     */
    function handleChoice(option, stepName) {
        STATE.userAnswers[stepName] = { text: option.text, value: option.value };
        navigateToStep(STATE.currentStepIndex + 1);
    }

    /**
     * Manipula o envio do formulário de texto.
     */
    function handleFormSubmit(event) {
        event.preventDefault(); // Impede o recarregamento da página
        if (STATE.isProcessing) return;
        
        const currentStep = CONFIG.journey[STATE.currentStepIndex];
        const answer = UI.userInput.value.trim();
        const validationRule = CONFIG.validationRegex[currentStep.validation];

        if (validationRule && !validationRule.test(answer)) {
            UI.userInput.classList.add('is-error');
            setTimeout(() => UI.userInput.classList.remove('is-error'), 500);
            return;
        }
        
        STATE.userAnswers[currentStep.name] = answer;
        navigateToStep(STATE.currentStepIndex + 1);
    }

    /**
     * Lógica para o final da jornada (vídeo e envio de dados).
     */
    async function finishJourney() {
        STATE.isProcessing = true;
        UI.appContainer.className = 'journey-app is-visible is-final-step';
        
        UI.backgroundMusic.pause();
        UI.finalVideo.src = CONFIG.finalVideoPath;
        UI.finalVideo.play().catch(err => console.error("Erro ao tocar vídeo:", err));
        UI.backBtn.classList.add('is-visible'); // Garante que o botão voltar apareça

        const payload = buildPayload();
        try {
            await fetch(CONFIG.webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Dados enviados com sucesso!');
        } catch (error) {
            console.error('Falha ao enviar dados:', error);
        } finally {
            STATE.isProcessing = false;
        }
    }

    /**
     * Monta o objeto de dados para envio ao webhook.
     */
    function buildPayload() {
        const payload = {
            nome: STATE.userAnswers.nome,
            email: STATE.userAnswers.email,
            telefone: STATE.userAnswers.telefone,
            classificacao_final: classifyLead()
        };
        CONFIG.journey.forEach(step => {
            if (step.type === 'multiple-choice' && STATE.userAnswers[step.name]) {
                payload[step.name] = STATE.userAnswers[step.name].text;
            }
        });
        return payload;
    }

    /**
     * Classifica o lead com base nas respostas. (Lógica original preservada)
     */
    function classifyLead() {
        const score = Object.values(STATE.userAnswers)
            .filter(answer => typeof answer === 'object' && typeof answer.value === 'number')
            .reduce((sum, answer) => sum + answer.value, 0);
        if (score >= 10) return "Quente";
        if (score >= 5) return "Morno";
        return "Frio";
    }

    /**
     * Manipula o evento 'popstate' (botão voltar/avançar do navegador).
     */
    function handleBrowserNavigation(event) {
        const state = event.state;
        if (state && typeof state.step !== 'undefined') {
            if (state.step === 'final') {
                 // Se o usuário volta da tela final, o ideal é recarregar a última etapa.
                STATE.currentStepIndex = CONFIG.journey.length - 1;
                navigateToStep(STATE.currentStepIndex);
            } else {
                navigateToStep(state.step);
            }
        } else {
            // Se não há estado, volta para o início.
            navigateToStep(0);
        }
    }
    
    /**
     * Inicializa a aplicação, pré-carrega imagens e define os listeners.
     */
    async function init() {
        // Configura música de fundo
        if (CONFIG.backgroundMusicPath) {
            UI.backgroundMusic.src = CONFIG.backgroundMusicPath;
            UI.backgroundMusic.volume = 0.2;
        }

        // Pré-carrega todas as imagens da jornada
        const imageSources = CONFIG.journey.map(step => step.image).filter(Boolean);
        await Promise.all(imageSources.map(src => new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = img.onerror = resolve;
        })));

        // Define os event listeners
        UI.inputForm.addEventListener('submit', handleFormSubmit);
        UI.backBtn.addEventListener('click', () => history.back()); // Agora usa a API do navegador
        UI.audioBtn.addEventListener('click', toggleMusic);
        UI.unmuteVideoBtn.addEventListener('click', unmuteVideo);
        window.addEventListener('popstate', handleBrowserNavigation);

        // Inicia a aplicação na etapa correta (baseado na URL)
        const initialStep = parseInt(window.location.hash.split('=')[1] - 1, 10) || 0;
        navigateToStep(initialStep);
        
        UI.appContainer.classList.add('is-visible');

        // Autoplay da música com interação do usuário
        document.body.addEventListener('click', () => {
            if (UI.backgroundMusic.paused && !UI.appContainer.classList.contains('is-final-step')) {
                toggleMusic(true);
            }
        }, { once: true });
    }

    function toggleMusic(forcePlay = false) {
        const music = UI.backgroundMusic;
        if (forcePlay || music.paused) {
            music.play().catch(() => {});
            UI.audioBtn.classList.remove('is-muted');
        } else {
            music.pause();
            UI.audioBtn.classList.add('is-muted');
        }
    }

    function unmuteVideo() {
        UI.finalVideo.muted = false;
        UI.unmuteVideoBtn.style.display = 'none';
    }

    // Inicia tudo!
    init();
});
