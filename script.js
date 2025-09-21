const state = {
    questions: [],
    currentIndex: 0,
    answers: [],
    marked: new Set(),
    startTime: Date.now(),
    duration: 195 * 60 
};


const timerEl = document.getElementById('timer');
const qcountEl = document.getElementById('qcount');
const questionContainer = document.getElementById('question-container');
const progressbar = document.getElementById('progressbar');
const reviewGrid = document.getElementById('review-grid');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const markBtn = document.getElementById('mark');
const submitBtn = document.getElementById('submit');

async function loadQuestions() {
    try {
        
        if (typeof questions !== 'undefined' && Array.isArray(questions)) {
            state.questions = questions;
        } else {
            throw new Error('Variabel questions tidak ditemukan.');
        }
    } catch (error) {
        console.error(error);
      
        state.questions = generateSampleQuestions(10);
    }
    

    state.answers = new Array(state.questions.length).fill(null);
    
 
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    markBtn.disabled = false;
    submitBtn.disabled = false;
    
 
    init();
}


function generateSampleQuestions(count) {
    const sampleQuestions = [];
    for (let i = 1; i <= count; i++) {
        sampleQuestions.push({
            id: i,
            text: `Contoh soal nomor ${i}. Ini adalah contoh soal yang digunakan ketika file soal.js tidak tersedia.`,
            choices: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
            answer: Math.floor(Math.random() * 4),
            type: 'single'
        });
    }
    return sampleQuestions;
}

function init() {
    renderQuestion();
    renderReviewGrid();
    startTimer();
    loadProgress();
    
 
    prevBtn.addEventListener('click', goToPrevQuestion);
    nextBtn.addEventListener('click', goToNextQuestion);
    markBtn.addEventListener('click', toggleMark);
    submitBtn.addEventListener('click', submitAnswers);
    

    document.addEventListener('keydown', handleKeydown);
}

function renderQuestion() {
    const question = state.questions[state.currentIndex];
    
    const questionHTML = `
        <div class="question-number">Soal #${state.currentIndex + 1}</div>
        <div class="question-text">${escapeHtml(question.text)}</div>
        <div class="choices">
            ${question.choices.map((choice, index) => `
                <div class="choice ${state.answers[state.currentIndex] === index ? 'selected' : ''}" 
                     data-index="${index}">
                    ${escapeHtml(choice)}
                </div>
            `).join('')}
        </div>
    `;
    
    questionContainer.innerHTML = questionHTML;
    
    qcountEl.textContent = `Soal ${state.currentIndex + 1}/${state.questions.length}`;
    
    const progress = ((state.currentIndex + 1) / state.questions.length) * 100;
    progressbar.style.width = `${progress}%`;
    
    const choiceElements = questionContainer.querySelectorAll('.choice');
    choiceElements.forEach(choice => {
        choice.addEventListener('click', () => {
            const selectedIndex = parseInt(choice.dataset.index);
            selectAnswer(selectedIndex);
        });
    });
    
    markBtn.textContent = state.marked.has(state.currentIndex) ? 'Batal Tandai' : 'Tandai';
    
    updateReviewGrid();
}

function selectAnswer(index) {
    state.answers[state.currentIndex] = index;
    renderQuestion();
    saveProgress();
}

function toggleMark() {
    if (state.marked.has(state.currentIndex)) {
        state.marked.delete(state.currentIndex);
    } else {
        state.marked.add(state.currentIndex);
    }
    renderQuestion();
    saveProgress();
}

function goToPrevQuestion() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        renderQuestion();
    }
}

function goToNextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        renderQuestion();
    }
}

function goToQuestion(index) {
    if (index >= 0 && index < state.questions.length) {
        state.currentIndex = index;
        renderQuestion();
    }
}

function renderReviewGrid() {
    reviewGrid.innerHTML = '';
    for (let i = 0; i < state.questions.length; i++) {
        const item = document.createElement('div');
        item.className = 'review-item';
        if (i === state.currentIndex) {
            item.classList.add('current');
        }
        if (state.answers[i] !== null) {
            item.classList.add('answered');
        }
        if (state.marked.has(i)) {
            item.classList.add('marked');
        }
        item.textContent = i + 1;
        item.addEventListener('click', () => goToQuestion(i));
        reviewGrid.appendChild(item);
    }
}

function updateReviewGrid() {
    const items = reviewGrid.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('current', 'answered', 'marked');
        if (i === state.currentIndex) {
            items[i].classList.add('current');
        }
        if (state.answers[i] !== null) {
            items[i].classList.add('answered');
        }
        if (state.marked.has(i)) {
            items[i].classList.add('marked');
        }
    }
}


function startTimer() {
    setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        const remainingSeconds = Math.max(0, state.duration - elapsedSeconds);
        
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (remainingSeconds === 0) {
            alert('Waktu telah habis!');
            submitAnswers();
        }
    }, 1000);
}

function handleKeydown(e) {
    if (e.key === 'ArrowLeft') {
        goToPrevQuestion();
    } else if (e.key === 'ArrowRight') {
        goToNextQuestion();
    } else if (e.key >= '1' && e.key <= '4') {
        const choiceIndex = parseInt(e.key) - 1;
        if (choiceIndex < state.questions[state.currentIndex].choices.length) {
            selectAnswer(choiceIndex);
        }
    } else if (e.key === 'm' || e.key === 'M') {
        toggleMark();
    }
}

function saveProgress() {
    const progress = {
        currentIndex: state.currentIndex,
        answers: state.answers,
        marked: Array.from(state.marked),
        startTime: state.startTime
    };
    localStorage.setItem('snbtProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('snbtProgress');
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            state.currentIndex = progress.currentIndex || 0;
            state.answers = progress.answers || new Array(state.questions.length).fill(null);
            state.marked = new Set(progress.marked || []);
            state.startTime = progress.startTime || Date.now();
        } catch (e) {
            console.error('Error loading progress:', e);
        }
    }
    renderQuestion();
}

function submitAnswers() {
    if (!confirm('Apakah Anda yakin ingin mengirim jawaban? Setelah dikirim, Anda tidak dapat mengubah jawaban.')) {
        return;
    }
    
    let score = 0;
    const results = [];
    
    for (let i = 0; i < state.questions.length; i++) {
        const isCorrect = state.answers[i] === state.questions[i].answer;
        if (isCorrect) score++;
        
        results.push({
            question: state.questions[i].text,
            yourAnswer: state.answers[i] !== null ? state.questions[i].choices[state.answers[i]] : 'Tidak dijawab',
            correctAnswer: state.questions[i].choices[state.questions[i].answer],
            isCorrect: isCorrect
        });
    }
    
 
    const resultHTML = `
        <div style="padding: 20px; text-align: center;">
            <h2 style="margin-bottom: 16px;">Hasil Simulasi SNBT</h2>
            <div style="font-size: 24px; margin-bottom: 20px; color: var(--secondary);">Skor: ${score}/${state.questions.length}</div>
            <div style="margin-bottom: 20px;">Detail hasil dapat dilihat di konsol browser (F12)</div>
            <button class="btn btn-primary" onclick="location.reload()">Mulai Lagi</button>
        </div>
    `;
    
    questionContainer.innerHTML = resultHTML;
    document.querySelector('.navigation').style.display = 'none';
    document.querySelector('.review-section').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    
    console.table(results);
    
    localStorage.removeItem('snbtProgress');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    loadQuestions();
});