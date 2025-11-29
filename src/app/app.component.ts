import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

declare var bootstrap: any;

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: { rate: number; count: number };
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  titulo = 'FakeStore';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = 'all';
  searchText = '';
  selectedProduct: Product | null = null;
  cart: CartItem[] = [];
  cartTotal = 0;

  private productModal: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadAllProducts();
    this.loadCartFromStorage();

    // Inicializar modal de Bootstrap
    setTimeout(() => {
      const modalEl = document.getElementById('productModal');
      if (modalEl) this.productModal = new bootstrap.Modal(modalEl);
    }, 300);
  }

  loadCategories() {
    this.http.get<string[]>('https://fakestoreapi.com/products/categories')
      .subscribe(cats => this.categories = cats);
  }

  loadAllProducts() {
    this.http.get<Product[]>('https://fakestoreapi.com/products')
      .subscribe(data => {
        this.products = data;
        this.filteredProducts = data;
      });
  }

  filterByCategory() {
    if (this.selectedCategory === 'all') {
      this.loadAllProducts();
    } else {
      this.http.get<Product[]>(`https://fakestoreapi.com/products/category/${this.selectedCategory}`)
        .subscribe(data => {
          this.products = data;
          this.applySearchFilter();
        });
    }
  }

  applySearchFilter() {
    this.filteredProducts = this.products.filter(p =>
      p.title.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openProductModal(product: Product) {
    this.selectedProduct = product;
    this.productModal?.show();
  }

  closeProductModal() {
    this.selectedProduct = null;
    this.productModal?.hide();
  }

  // === AGREGAR AL CARRITO CON SWEETALERT2 ===
  addToCart(product: Product) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
    this.saveCart();
    this.closeProductModal();

    // SweetAlert2 - ¡Éxito al agregar!
    Swal.fire({
      title: '¡Agregado!',
      text: `${product.title.substring(0, 40)}... se agregó al carrito`,
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      background: '#d4edda',
      color: '#155724'
    });
  }

  removeFromCart(productId: number) {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this.saveCart();
  }

  updateQuantity(item: CartItem, change: number) {
    item.quantity += change;
    if (item.quantity <= 0) {
      this.removeFromCart(item.product.id);
    } else {
      this.saveCart();
    }
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.updateTotal();
  }

  loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      this.cart = JSON.parse(saved);
      this.updateTotal();
    }
  }

  updateTotal() {
    this.cartTotal = this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  // === PAGAR CON SWEETALERT2 ===
  pay() {
    Swal.fire({
      title: '¡Pago Exitoso!',
      text: `Has pagado $${this.cartTotal.toFixed(2)} con éxito. ¡Gracias por tu compra!`,
      icon: 'success',
      confirmButtonText: 'Genial',
      confirmButtonColor: '#28a745'
    }).then(() => {
      this.cart = [];
      localStorage.removeItem('cart');
      this.updateTotal();
    });
  }
}