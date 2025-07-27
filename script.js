document.addEventListener('DOMContentLoaded', () => {

    // AJUSTE: Função para corrigir a altura da tela (vh) em dispositivos móveis
    const setVhVariable = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setVhVariable);
    setVhVariable(); // Executa na inicialização

    // ===================================================================
    // =================== ÁREA DE CONFIGURAÇÃO ESTRATÉGICA ==============
    // ===================================================================
    const webhookURL = 'http://localhost:5678/webhook-test/capturadeclientes';
    const finalVideoPath = 'video.mp4';
    const backgroundMusicPath = 'musica.mp3';

    const validationRegex = {
        name: /^[a-zA-ZáàãâéèêíìóòõôúùçÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙ\s'-]{3,}$/,
        phone: /^\(?(?:[1-9][0-9])\)?\s?9?\d{4,5}-?\d{4}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };
    const journey = [ { type: 'multiple-choice', name: "etapa_1_engajamento", image: "imagem01.jpg", options: [ { text: "Perco clientes por demora", value: 2 }, { text: "Meu processo é manual", value: 1 }, { text: "Estou apenas curioso", value: 0 } ] }, { type: 'text-input', name: 'nome', image: 'imagem02.jpg', question: 'Entendido. Para continuarmos, qual seu nome?', validation: validationRegex.name }, { type: 'text-input', name: 'email', image: 'imagem03.jpg', question: 'Obrigado. Agora, seu melhor e-mail.', validation: validationRegex.email }, { type: 'text-input', name: 'telefone', image: 'imagem04.jpg', question: 'Perfeito. E para finalizar, seu telefone.', validation: validationRegex.phone }, { type: 'multiple-choice', name: "etapa_2_solucao", image: "imagem05.jpg", options: [ { text: "Preciso automatizar agora", value: 2 }, { text: "Quero mais eficiência", value: 1 }, { text: "Tenho medo de robôs", value: 0 } ] }, { type: 'multiple-choice', name: "etapa_3_disponibilidade", image: "imagem06.jpg", options: [ { text: "Quero atender 24/7", value: 2 }, { text: "Atendo em horário comercial", value: 1 }, { text: "Meu público é específico", value: 0 } ] }, { type: 'multiple-choice', name: "etapa_4_investimento", image: "imagem07.jpg", options: [ { text: "Investir para escalar", value: 2 }, { text: "Busco custo-benefício", value: 1 }, { text: "Quero algo gratuito", value: 0 } ] }, { type: 'multiple-choice', name: "etapa_5_implementacao", image: "imagem08.jpg", options: [ { text: "Quero começar hoje", value: 2 }, { text: "Preciso de ajuda para iniciar", value: 1 }, { text: "Parece complicado", value: 0 } ] }, { type: 'multiple-choice', name: "etapa_6_concorrencia", image: "imagem09.jpg", options: [ { text: "Quero estar à frente", value: 2 }, { text: "Acompanho o mercado", value: 1 }, { text: "Não me comparo", value: 0 } ] }, { type: 'multiple-choice', name: "etapa_7_decisao", image: "imagem10.jpg", options: [ { text: "Vamos iniciar a parceria", value: 2 }, { text: "Preciso de mais detalhes", value: 1 }, { text: "Vou pensar a respeito", value: 0 } ] } ];
    
    // ======================= FIM DA CONFIGURAÇÃO =======================

    const ui = {
        interactionContainer: document.getElementById('interaction-container'),
        messageContainer: document.getElementById('message-container'),
        optionsContainer: document.getElementById('options-container'),
        inputArea: document.getElementById('text-input-form'), // Referência ao form
        userInput: document.getElementById('user-input'),
        imageBg1: document.getElementById('image-bg-1'),
        imageBg2: document.getElementById('image-bg-2'),
        backgroundMusic: document.getElementById('background-music'),
        backBtn: document.getElementById('back-btn'),
        audioBtn: document.getElementById('audio-btn'),
        finalVideo: document.getElementById('final-video'),
        unmuteVideoBtn: document.getElementById('unmute-video-btn'),
    };

    let appState = 'JOURNEY';
    let currentStepIndex = 0;
    let userAnswers = {};
    let isProcessing = false;
    let activeImage = ui.imageBg1;
    let inactiveImage = ui.imageBg2;

    const updateImage = (newSrc) => {
        return new Promise((resolve) => {
            if (!newSrc || activeImage.src.endsWith(newSrc)) return resolve();
            inactiveImage.src = newSrc;
            const listener = () => {
                activeImage.classList.remove('active');
                inactiveImage.classList.add('active');
                [activeImage, inactiveImage] = [inactiveImage, activeImage];
                inactiveImage.removeEventListener('load', listener);
                resolve();
            };
            inactiveImage.addEventListener('load', listener);
            inactiveImage.onerror = () => {
                console.error(`Erro ao carregar imagem: ${newSrc}`);
                inactiveImage.removeEventListener('load', listener);
                resolve();
            };
        });
    };
    
    const renderStep = async () => {
        if (currentStepIndex >= journey.length) {
            finishJourney();
            return;
        }
        isProcessing = true;
        appState = 'JOURNEY';
        const currentStep = journey[currentStepIndex];
        ui.backBtn.style.display = currentStepIndex > 0 ? 'flex' : 'none';
        ui.audioBtn.style.display = 'flex';
        ui.finalVideo.style.display = 'none';
        await updateImage(currentStep.image);
        ui.messageContainer.innerHTML = '';
        ui.optionsContainer.innerHTML = '';
        ui.inputArea.style.display = 'none';
        if (currentStep.type === 'text-input') {
            ui.inputArea.style.display = 'block';
            ui.userInput.value = userAnswers[currentStep.name] || '';
            ui.userInput.classList.remove('error');
            ui.userInput.focus();
            const msgEl = document.createElement('div');
            msgEl.className = 'bot-message';
            msgEl.textContent = currentStep.question;
            ui.messageContainer.appendChild(msgEl);
        } else if (currentStep.type === 'multiple-choice') {
            currentStep.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option.text;
                button.style.animationDelay = `${index * 100}ms`;
                button.onclick = () => handleChoice(option, currentStep.name);
                ui.optionsContainer.appendChild(button);
            });
        }
        setTimeout(() => isProcessing = false, 200);
    };

    const handleTextInput = () => {
        if (isProcessing) return;
        const currentStep = journey[currentStepIndex];
        const answer = ui.userInput.value.trim();
        if (currentStep.validation && !currentStep.validation.test(answer)) {
            ui.userInput.classList.add('error');
            setTimeout(() => ui.userInput.classList.remove('error'), 500);
            return;
        }
        isProcessing = true;
        userAnswers[currentStep.name] = answer;
        currentStepIndex++;
        renderStep();
    };
    
    const handleChoice = (option, stepName) => {
        if (isProcessing) return;
        isProcessing = true;
        userAnswers[stepName] = { text: option.text, value: option.value };
        currentStepIndex++;
        renderStep();
    };

    const goBack = () => {
        if (isProcessing) return;
        if (currentStepIndex === 0 && appState !== 'FINISHED') return;
        isProcessing = true;
        if (appState === 'FINISHED') {
            ui.finalVideo.pause();
            if (!ui.backgroundMusic.muted) {
                ui.backgroundMusic.play().catch(()=>{});
            }
            const lastStepName = journey[journey.length - 1].name;
            delete userAnswers[lastStepName];
            currentStepIndex = journey.length - 1;
        } else {
            currentStepIndex--;
        }
        const previousStep = journey[currentStepIndex];
        delete userAnswers[previousStep.name];
        renderStep();
    };

    const classifyLead = () => {
        const score = Object.values(userAnswers).filter(answer => typeof answer === 'object' && typeof answer.value === 'number').reduce((sum, answer) => sum + answer.value, 0);
        if (score >= 10) return "Quente";
        if (score >= 5) return "Morno";
        return "Frio";
    };

    const finishJourney = async () => {
        isProcessing = true;
        appState = 'FINISHED';
        ui.inputArea.style.display = 'none';
        ui.messageContainer.innerHTML = '';
        ui.optionsContainer.innerHTML = '';
        activeImage.classList.remove('active');
        inactiveImage.classList.remove('active');
        ui.backgroundMusic.pause();
        ui.finalVideo.src = finalVideoPath;
        ui.finalVideo.style.display = 'block';
        ui.unmuteVideoBtn.style.display = 'block';
        ui.backBtn.style.display = 'flex';
        ui.finalVideo.play();
        const payload = { nome: userAnswers.nome, email: userAnswers.email, telefone: userAnswers.telefone, classificacao_final: classifyLead() };
        journey.forEach(step => { if(step.type === 'multiple-choice' && userAnswers[step.name]) { payload[step.name] = userAnswers[step.name].text; } });
        try {
            await fetch(webhookURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            console.log('Dados enviados com sucesso para o n8n!');
        } catch (error) {
            console.error('Falha ao enviar dados:', error);
        } finally {
            isProcessing = false;
        }
    };
    
    const init = async () => {
        if (backgroundMusicPath) {
            ui.backgroundMusic.src = backgroundMusicPath;
            ui.backgroundMusic.volume = 0.2;
        }
        const imageSources = journey.map(step => step.image).filter(Boolean);
        const imagePromises = imageSources.map(src => new Promise((resolve) => { const img = new Image(); img.src = src; img.onload = resolve; img.onerror = resolve; }));
        await Promise.all(imagePromises);
        activeImage.src = journey[0].image;
        await new Promise(resolve => setTimeout(resolve, 10));
        activeImage.classList.add('active');
        ui.interactionContainer.classList.add('visible');
        renderStep();
    };
    
    // AJUSTE: O evento agora escuta o 'submit' do formulário, não mais a tecla 'Enter'
    ui.inputArea.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o recarregamento da página, que é o comportamento padrão
        handleTextInput();
    });
    
    ui.backBtn.addEventListener('click', goBack);
    ui.audioBtn.addEventListener('click', () => {
        const music = ui.backgroundMusic;
        if (music.paused) { music.play().catch(() => {}); ui.audioBtn.classList.remove('muted'); } 
        else { music.pause(); ui.audioBtn.classList.add('muted'); }
    });
    ui.unmuteVideoBtn.addEventListener('click', () => {
        ui.finalVideo.muted = false;
        ui.unmuteVideoBtn.style.display = 'none';
    });
    document.body.addEventListener('click', () => {
        if (ui.backgroundMusic.paused && appState !== 'FINISHED') {
             ui.backgroundMusic.play().catch(() => {});
             ui.audioBtn.classList.remove('muted');
        }
    }, { once: true });
    
    init();
});
