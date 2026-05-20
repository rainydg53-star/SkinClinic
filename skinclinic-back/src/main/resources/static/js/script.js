document.addEventListener('DOMContentLoaded', () => {
    const slideContainer = document.getElementById('slideContainer');
    let currentIndex = 0;

    window.moveSlide = (direction) => {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = 2;
        if (currentIndex > 2) currentIndex = 0;
        slideContainer.style.transform = `translateX(-${currentIndex * 33.333}%)`;
    };

    setInterval(() => moveSlide(1), 3000);
});
function scrollSlider(direction) {
    const container = document.getElementById('cardSlider');
    const scrollAmount = 250; // 카드 너비만큼 이동
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}