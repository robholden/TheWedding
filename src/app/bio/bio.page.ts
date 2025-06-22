import { Component, OnInit } from '@angular/core';

declare var Swiper: any; // Import Swiper from the global scope

@Component({
    selector: 'wed-bio-page',
    templateUrl: './bio.page.html',
    styleUrls: ['./bio.page.scss'],
    imports: [],
})
export default class BioPage implements OnInit {
    readonly images = ['rr_one.jpeg', 'rr_two.jpg', 'rr_three.jpeg', 'rr_four.jpeg', 'rr_five.jpeg', 'rr_six.jpeg', 'rr_seven.jpeg', 'rr_eight.jpeg', 'rr_nine.jpeg'];

    ngOnInit(): void {
        setTimeout(() => this.loadSwiper(), 0);
    }

    private loadSwiper(): void {
        var swiper = new Swiper('.swiper-container', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            centeredSlides: true,
            grabCursor: true,
            loop: 'auto',
            parallax: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }
}
