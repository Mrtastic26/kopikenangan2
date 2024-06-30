document.addEventListener('alpine:init', () => {
  Alpine.data('products', () => ({
    items: [
      { id: 1, name: 'Robusta Brazil', img: '1.jpeg', price: 20000 },
      { id: 2, name: 'Arabica Blend', img: '2(.jpeg', price: 25000 },  // corrected image path
      { id: 3, name: 'Primo Passo', img: '3.jpeg', price: 30000 },
      { id: 4, name: 'Aceh Gayo', img: '4.jpeg', price: 35000 },
      { id: 5, name: 'Colombia Bogota', img: '5.jpeg', price: 40000 },
    ],
    searchQuery: '',
    highlightedItems: [],
    highlightMatches() {
      this.clearHighlights();
      if (this.searchQuery === '') return;
      const query = this.searchQuery.toLowerCase();
      this.items.forEach((item, index) => {
        const itemElement = document.getElementById(`product-${item.id}`);
        const text = itemElement.innerText.toLowerCase();
        if (text.includes(query)) {
          const regex = new RegExp(`(${this.searchQuery})`, 'gi');
          itemElement.innerHTML = itemElement.innerHTML.replace(regex, '<span class="highlight">$1</span>');
          this.highlightedItems.push(itemElement);
        }
      });
    },
    clearHighlights() {
      this.highlightedItems.forEach((itemElement) => {
        itemElement.innerHTML = itemElement.innerText;
      });
      this.highlightedItems = [];
    },
    scrollToFirstMatch() {
      if (this.highlightedItems.length > 0) {
        this.highlightedItems[0].scrollIntoView({ behavior: 'smooth' });
      }
    },
  }));

  Alpine.store('cart', {
    items: [],
    total: 0,
    quantity: 0,

    add(newItem) {
      const cartItem = this.items.find((item) => item.id === newItem.id);

      if (!cartItem) {
        this.items.push({ ...newItem, quantity: 1, total: newItem.price });
        this.quantity++;
        this.total += newItem.price;
      } else {
        this.items = this.items.map((item) => {
          if (item.id !== newItem.id) {
            return item;
          } else {
            item.quantity++;
            item.total = item.price * item.quantity;
            this.quantity++;
            this.total += newItem.price;
            return item;
          }
        });
      }
    },

    remove(id) {
      const cartItem = this.items.find((item) => item.id === id);

      if (cartItem.quantity > 1) {
        this.items = this.items.map((item) => {
          if (item.id !== id) {
            return item;
          } else {
            item.quantity--;
            item.total = item.price * item.quantity;
            this.quantity--;
            this.total -= item.price;
            return item;
          }
        });
      } else if (cartItem.quantity === 1) {
        this.items = this.items.filter((item) => item.id !== id);
        this.quantity--;
        this.total -= cartItem.price;
      }
    },
  });
});

const checkoutButton = document.querySelector('.checkout-button');
checkoutButton.disabled = true;

const form = document.querySelector('#checkoutForm');
form.addEventListener('keyup', function() {
  let allFilled = true;
  for (let i = 0; i < form.elements.length; i++) {
    if (form.elements[i].value.length === 0) {
      allFilled = false;
      break;
    }
  }
  if (allFilled) {
    checkoutButton.disabled = false;
    checkoutButton.classList.remove('disabled');
  } else {
    checkoutButton.disabled = true;
    checkoutButton.classList.add('disabled');
  }
});

checkoutButton.addEventListener('click', async function(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = new URLSearchParams(formData);

  try {
    const response = await fetch('php/placeOrder.php', {
      method: 'POST',
      body: data,
    });
    const token = await response.text();
    //console.log(token);
    window.snap.pay('token');
  } catch (err) {
    console.log(err.message);
  }
});

const formatMessage = (obj) => {
  return `Data Customer
Nama: ${obj.name}
Email: ${obj.email}
No HP: ${obj.phone}

Data Pesanan
${JSON.parse(obj.items).map((item) => `${item.name} (${item.quantity} x ${rupiah(item.price)})`).join('\n')}
TOTAL: ${rupiah(obj.total)}

Terima kasih.`;
};

// Function to format number as Rupiah
const rupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};
