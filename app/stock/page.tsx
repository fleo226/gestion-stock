</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {search ? 'Aucun résultat' : 'Aucun article'}
            </h3>
            <p className="text-gray-500 mb-5 text-sm">
              {search ? 'Essayez une autre recherche' : 'Ajoutez votre premier article pour commencer'}
            </p>
            {!search && (
              <Link
                href="/article/nouveau"
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl text-base font-medium touch-manipulation"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un article</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors">
                <Link href={`/article/${article.id}`} className="block p-4">
                  <div className="flex items-center space-x-3">
                    {/* Photo / Avatar */}
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {article.photoUrl ? (
                        <img
                          src={article.photoUrl}
                          alt={article.nom}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-300">{article.nom.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{article.nom}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {article.taille && <span>{article.taille}</span>}
                        {article.taille && article.couleur && <span>·</span>}
                        {article.couleur && <span>{article.couleur}</span>}
                        <span>·</span>
                        <span className="font-medium" style={{ color: article.quantite > 0 ? accentColor : '#ef4444' }}>
                          {article.quantite} {article.unite}
                        </span>
                      </div>
                    </div>

                    {/* Price & Profit */}
                    <div className="text-right flex-shrink-0">
                      {article.vendu > 0 && (
                        {p className="text-sm font-medium text-gray-900>{formatPrice(article.prixVente)}</p>
                        {article.vendu > 0 && (
                          {p className="text-xs text-green-600>+{formatPrice(article.benefice)}</p>
                        )}
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/article/nouveau"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:shadow-md transition-all touch-manipulation z-40"
        style={{ backgroundColor: accentColor }}
      >
        <Plus className="h-6 w-6} />
      </Link>
    <AIAssistant />
    </div>
  );
}

function StatPill({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${bg} flex-shrink-0`}>
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-gray-500>{label}</p>
        <p className={`text-sm font-semibold {color}`}>{value}</p>
      </div>
    </div>
  );
}