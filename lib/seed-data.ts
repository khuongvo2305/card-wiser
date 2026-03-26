// Seed data based on the user's actual credit card portfolio
// Total credit limit: ~502,000,000 VND across 7 cards

export const SEED_CARDS = [
  {
    card_name: 'LPBank Visa Signature',
    bank_name: 'LPBank',
    last_four_digits: '',
    credit_limit: 100_000_000,
    current_balance: 0,
    statement_date: 15,
    due_date: 5,
    card_color: '#3B82F6',
    is_active: true,
    notes: 'Combo LPBank (dùng chung hạn mức 100tr với JCB). Trùm Du lịch: tích điểm cao, 8 lượt phòng chờ, 4 lượt đưa đón sân bay, phí chuyển đổi ngoại tệ 1%.',
  },
  {
    card_name: 'LPBank JCB Ultimate',
    bank_name: 'LPBank',
    last_four_digits: '',
    credit_limit: 100_000_000,
    current_balance: 0,
    statement_date: 15,
    due_date: 5,
    card_color: '#8B5CF6',
    is_active: true,
    notes: 'Combo LPBank (dùng chung hạn mức 100tr với Visa Sig). Trùm Y tế/Giáo dục/Bảo hiểm: hoàn 15%.',
  },
  {
    card_name: 'Techcombank Everyday',
    bank_name: 'Techcombank',
    last_four_digits: '',
    credit_limit: 100_000_000,
    current_balance: 0,
    statement_date: 20,
    due_date: 10,
    card_color: '#EF4444',
    is_active: true,
    notes: 'Chi tiêu hàng ngày, siêu thị, hóa đơn.',
  },
  {
    card_name: 'MSB MDigi',
    bank_name: 'MSB',
    last_four_digits: '',
    credit_limit: 100_000_000,
    current_balance: 0,
    statement_date: 10,
    due_date: 28,
    card_color: '#F97316',
    is_active: true,
    notes: 'Hoàn 20% (max 300k) Ăn uống, Du lịch, Giải trí.',
  },
  {
    card_name: 'Sacombank UNIQ',
    bank_name: 'Sacombank',
    last_four_digits: '',
    credit_limit: 100_000_000,
    current_balance: 0,
    statement_date: 5,
    due_date: 25,
    card_color: '#22C55E',
    is_active: true,
    notes: 'Hoàn 20% (max 300k) Siêu thị, Grab/Be.',
  },
  {
    card_name: 'UOB One',
    bank_name: 'UOB',
    last_four_digits: '',
    credit_limit: 60_000_000,
    current_balance: 0,
    statement_date: 18,
    due_date: 8,
    card_color: '#14B8A6',
    is_active: true,
    notes: 'Hoàn 10% Grab/Vận tải.',
  },
  {
    card_name: 'BIDV JCB Ultimate',
    bank_name: 'BIDV',
    last_four_digits: '',
    credit_limit: 42_000_000,
    current_balance: 0,
    statement_date: 25,
    due_date: 15,
    card_color: '#EAB308',
    is_active: true,
    notes: 'Hoàn 10-20% Ẩm thực. Đặc quyền Golf/Nhà hàng cao cấp. Miễn phí chuyển đổi ngoại tệ tại Nhật.',
  },
]

// Cashback policies mapped to cards by card_name
// category_name references spending categories seeded separately
export const SEED_CASHBACK_POLICIES: {
  card_name: string
  policies: {
    category_name: string
    cashback_percentage: number
    cap_amount: number | null
    min_spend: number | null
    notes: string | null
    is_active: boolean
  }[]
}[] = [
  {
    card_name: 'LPBank Visa Signature',
    policies: [
      {
        category_name: 'Du lịch',
        cashback_percentage: 5,
        cap_amount: null,
        min_spend: null,
        notes: '8 lượt phòng chờ/năm, 4 lượt đưa đón sân bay/năm',
        is_active: true,
      },
      {
        category_name: 'Online',
        cashback_percentage: 1,
        cap_amount: null,
        min_spend: null,
        notes: 'Phí chuyển đổi ngoại tệ chỉ 1%',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'LPBank JCB Ultimate',
    policies: [
      {
        category_name: 'Y tế',
        cashback_percentage: 15,
        cap_amount: null,
        min_spend: null,
        notes: 'Trùm Y tế/Bảo hiểm',
        is_active: true,
      },
      {
        category_name: 'Giáo dục',
        cashback_percentage: 15,
        cap_amount: null,
        min_spend: null,
        notes: 'Trùm Giáo dục',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'Techcombank Everyday',
    policies: [
      {
        category_name: 'Thực phẩm',
        cashback_percentage: 1,
        cap_amount: null,
        min_spend: null,
        notes: 'Chi tiêu siêu thị hàng ngày',
        is_active: true,
      },
      {
        category_name: 'Hóa đơn',
        cashback_percentage: 1,
        cap_amount: null,
        min_spend: null,
        notes: 'Thanh toán hóa đơn tiện ích',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'MSB MDigi',
    policies: [
      {
        category_name: 'Ăn uống',
        cashback_percentage: 20,
        cap_amount: 300_000,
        min_spend: null,
        notes: 'Max hoàn 300k/tháng',
        is_active: true,
      },
      {
        category_name: 'Du lịch',
        cashback_percentage: 20,
        cap_amount: 300_000,
        min_spend: null,
        notes: 'Max hoàn 300k/tháng',
        is_active: true,
      },
      {
        category_name: 'Giải trí',
        cashback_percentage: 20,
        cap_amount: 300_000,
        min_spend: null,
        notes: 'Max hoàn 300k/tháng',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'Sacombank UNIQ',
    policies: [
      {
        category_name: 'Thực phẩm',
        cashback_percentage: 20,
        cap_amount: 300_000,
        min_spend: null,
        notes: 'Siêu thị. Max hoàn 300k/tháng.',
        is_active: true,
      },
      {
        category_name: 'Di chuyển',
        cashback_percentage: 20,
        cap_amount: 300_000,
        min_spend: null,
        notes: 'Grab/Be. Max hoàn 300k/tháng.',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'UOB One',
    policies: [
      {
        category_name: 'Di chuyển',
        cashback_percentage: 10,
        cap_amount: null,
        min_spend: null,
        notes: 'Grab/Vận tải',
        is_active: true,
      },
    ],
  },
  {
    card_name: 'BIDV JCB Ultimate',
    policies: [
      {
        category_name: 'Ăn uống',
        cashback_percentage: 10,
        cap_amount: null,
        min_spend: null,
        notes: 'Ẩm thực, hoàn 10-20%. Đặc quyền Golf/Nhà hàng cao cấp.',
        is_active: true,
      },
    ],
  },
]

export const SEED_CATEGORIES = [
  { name: 'Ăn uống', icon: '🍽️', color: '#F97316' },
  { name: 'Mua sắm', icon: '🛒', color: '#EC4899' },
  { name: 'Online', icon: '🌐', color: '#3B82F6' },
  { name: 'Di chuyển', icon: '🚗', color: '#EAB308' },
  { name: 'Thực phẩm', icon: '🥦', color: '#22C55E' },
  { name: 'Hóa đơn', icon: '💡', color: '#6366F1' },
  { name: 'Y tế', icon: '🏥', color: '#EF4444' },
  { name: 'Giáo dục', icon: '📚', color: '#8B5CF6' },
  { name: 'Du lịch', icon: '✈️', color: '#14B8A6' },
  { name: 'Giải trí', icon: '🎬', color: '#F43F5E' },
  { name: 'Khác', icon: '💼', color: '#6B7280' },
]
