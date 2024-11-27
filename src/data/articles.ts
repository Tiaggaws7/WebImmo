export interface Article {
    id: number;
    title: string;
    category: 'Acheteur' | 'Vendeur' | 'Investisseur' | 'General';
    excerpt: string;
    content: string;
    date: string;
    author: string;
  }
  
  export const articles: Article[] = [
    {
      id: 1,
      title: "Les étapes clés pour un premier achat immobilier",
      category: 'Acheteur',
      excerpt: "Découvrez les étapes indispensables pour réussir votre premier achat immobilier.",
      content: "Acheter une maison ou un appartement pour la première fois peut être intimidant. De la recherche d’un financement à la signature finale chez le notaire, chaque étape doit être bien préparée. Commencez par définir votre budget, explorez différentes options de prêt et assurez-vous de visiter plusieurs propriétés avant de prendre une décision.",
      date: "2024-11-01",
      author: "Sophie Dupont"
    },
    {
      id: 2,
      title: "Comment augmenter la valeur de votre bien avant la vente",
      category: 'Vendeur',
      excerpt: "Astuces pour optimiser la valeur de votre maison ou appartement avant de le mettre en vente.",
      content: "Pour vendre rapidement et au meilleur prix, quelques améliorations peuvent faire toute la différence. Repeignez les murs avec des couleurs neutres, améliorez l’éclairage et envisagez des petites rénovations comme changer les poignées de porte ou moderniser la salle de bain. Un home staging réussi peut également séduire les acheteurs.",
      date: "2024-10-15",
      author: "Jean Martin"
    },
    {
      id: 3,
      title: "Stratégies d’investissement immobilier pour débutants",
      category: 'Investisseur',
      excerpt: "Un guide complet pour ceux qui souhaitent se lancer dans l’investissement immobilier.",
      content: "Investir dans l’immobilier peut être une excellente façon de bâtir un patrimoine. Commencez par définir vos objectifs : souhaitez-vous un revenu passif grâce à la location ou une plus-value à long terme ? Renseignez-vous sur les différents types de propriétés, les emplacements prometteurs et les avantages fiscaux disponibles.",
      date: "2024-09-20",
      author: "Laura Morel"
    },
    {
      id: 4,
      title: "L'impact du COVID-19 sur le marché immobilier",
      category: 'General',
      excerpt: "Analyse des effets de la pandémie sur les tendances et les prix du logement.",
      content: "La pandémie de COVID-19 a transformé le marché immobilier. Les villes ont vu une baisse de la demande, tandis que les zones rurales ont gagné en popularité. Les taux d’intérêt historiquement bas ont stimulé les achats, mais la pénurie de matériaux de construction a fait grimper les prix des nouvelles maisons.",
      date: "2024-08-05",
      author: "Alexandre Leroy"
    },
  ];
  