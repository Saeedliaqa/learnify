// Quiz Generation Integration Script
// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Generate question function - matches your existing onclick="generateQuestion()"
async function generateQuestion() {
    const topicInput = document.getElementById('topicInput');
    const inputContainer = document.getElementById('inputContainer');
    const questionContainer = document.getElementById('questionContainer');
    const getQuestionBtn = document.getElementById('getQuestion');
    
    const topic = topicInput.value.trim();
    
    // Validate input
    if (!topic) {
        alert('Please enter a topic to generate questions.');
        return;
    }
    
    // Show loading state
    showLoading(getQuestionBtn);
    
    try {
        // Make API request
        const response = await fetch(`${API_BASE_URL}/api/quiz/generate-question`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                topic: topic,
                difficulty: 'medium',
                numberOfQuestions: 1
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display the question using your existing structure
        displayQuestion(data, inputContainer, questionContainer);
        
    } catch (error) {
        console.error('Error generating question:', error);
        alert('Failed to generate question. Please try again.');
    } finally {
        // Reset button state
        resetButton(getQuestionBtn);
    }
}

// Display question in the existing questionContainer div
function displayQuestion(data, inputContainer, questionContainer) {
    // Hide input container
    inputContainer.style.display = 'none';
    
    // Show question container - remove hidden class and add flex
    questionContainer.classList.remove('hidden');
    questionContainer.classList.add('flex');
    
    // Get the existing div inside questionContainer (the gray-300 text div)
    const questionDiv = questionContainer.querySelector('.text-gray-300');
    
    // Assuming your API returns questions array or single question
    const questions = data.questions || [data];
    const question = questions[0];
    
    // Create question HTML that fits in the existing structure
    const questionHTML = `
        <div class="w-full text-center space-y-6">
            <h4 class="text-2xl sm:text-3xl font-bold text-white mb-6">
                ${question.question}
            </h4>
            
            <div class="space-y-4 max-w-2xl mx-auto">
                ${question.options ? question.options.map((option, index) => `
                    <label class="flex items-center p-4 bg-white bg-opacity-10 rounded-xl cursor-pointer hover:bg-opacity-20 transition-all duration-200 text-left">
                        <input type="radio" name="quizAnswer" value="${option}" class="mr-4 w-4 h-4 text-blue-500">
                        <span class="text-white text-lg">${option}</span>
                    </label>
                `).join('') : `
                    <div class="bg-white bg-opacity-10 rounded-xl p-6">
                        <textarea 
                            id="openAnswer" 
                            placeholder="Type your answer here..." 
                            class="w-full p-4 bg-white bg-opacity-20 rounded-lg text-white placeholder-gray-300 border-none outline-none resize-none"
                            rows="4"
                        ></textarea>
                    </div>
                `}
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button 
                    onclick="submitAnswer('${question.correctAnswer}')" 
                    class="px-6 py-3 bg-white text-[#212121] font-semibold rounded-3xl hover:bg-gray-100 transition-colors"
                >
                    Submit Answer
                </button>
                <button 
                    onclick="resetQuiz()" 
                    class="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-3xl hover:bg-white hover:text-[#212121] transition-colors"
                >
                    Try Another Topic
                </button>
            </div>
        </div>
    `;
    
    // Replace the content of the gray text div
    if (questionDiv) {
        questionDiv.innerHTML = questionHTML;
        questionDiv.className = 'text-white text-base sm:text-lg text-center px-2 w-full';
    } else {
        // If the div doesn't exist, create it
        questionContainer.innerHTML = `<div class="text-white text-base sm:text-lg text-center px-2 w-full">${questionHTML}</div>`;
    }
}

// Submit answer function
function submitAnswer(correctAnswer) {
    const selectedAnswer = document.querySelector('input[name="quizAnswer"]:checked');
    const openAnswer = document.getElementById('openAnswer');
    
    let userAnswer = '';
    
    if (selectedAnswer) {
        userAnswer = selectedAnswer.value;
    } else if (openAnswer) {
        userAnswer = openAnswer.value.trim();
    }
    
    if (!userAnswer) {
        alert('Please provide an answer.');
        return;
    }
    
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    // Show result
    showResult(isCorrect, correctAnswer, userAnswer);
}

// Show result in the same container
function showResult(isCorrect, correctAnswer, userAnswer) {
    const questionContainer = document.getElementById('questionContainer');
    const questionDiv = questionContainer.querySelector('div');
    
    const resultHTML = `
        <div class="w-full text-center space-y-6">
            <div class="text-8xl mb-6">
                ${isCorrect ? '🎉' : '❌'}
            </div>
            <h4 class="text-3xl sm:text-4xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}">
                ${isCorrect ? 'Correct!' : 'Incorrect!'}
            </h4>
            <div class="space-y-3 text-white">
                <p class="text-xl">
                    Your answer: <span class="font-semibold">${userAnswer}</span>
                </p>
                ${!isCorrect ? `<p class="text-xl">
                    Correct answer: <span class="font-semibold text-green-400">${correctAnswer}</span>
                </p>` : ''}
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button 
                    onclick="resetQuiz()" 
                    class="px-6 py-3 bg-white text-[#212121] font-semibold rounded-3xl hover:bg-gray-100 transition-colors"
                >
                    Try Another Topic
                </button>
            </div>
        </div>
    `;
    
    if (questionDiv) {
        questionDiv.innerHTML = resultHTML;
    }
}

// Reset quiz to initial state - works with your existing HTML structure
function resetQuiz() {
    const inputContainer = document.getElementById('inputContainer');
    const questionContainer = document.getElementById('questionContainer');
    const topicInput = document.getElementById('topicInput');
    
    // Clear input
    topicInput.value = '';
    
    // Show input container
    inputContainer.style.display = 'flex';
    
    // Hide question container - add hidden class and remove flex
    questionContainer.classList.add('hidden');
    questionContainer.classList.remove('flex');
    
    // Reset the question container content to original state
    const questionDiv = questionContainer.querySelector('.text-gray-300') || questionContainer.querySelector('div');
    if (questionDiv) {
        questionDiv.innerHTML = '<!--  Question appears here dynamically!  -->';
        questionDiv.className = 'text-gray-300 text-base sm:text-lg text-center px-2';
    }
}

// Show loading state on button
function showLoading(button) {
    button.disabled = true;
    button.innerHTML = 'Generating...';
    button.style.opacity = '0.7';
}

// Reset button state
function resetButton(button) {
    button.disabled = false;
    button.innerHTML = 'Generate Quiz';
    button.style.opacity = '1';
}

// Add enter key support for topic input
document.addEventListener('DOMContentLoaded', function() {
    const topicInput = document.getElementById('topicInput');
    if (topicInput) {
        topicInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateQuestion();
            }
        });
    }
});

// Handle API connection issues
window.addEventListener('offline', function() {
    alert('Connection lost. Please check your internet connection.');
});

// Optional: Auto-focus on topic input when page loads
document.addEventListener('DOMContentLoaded', function() {
    const topicInput = document.getElementById('topicInput');
    if (topicInput) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            topicInput.focus();
        }, 500);
    }
});